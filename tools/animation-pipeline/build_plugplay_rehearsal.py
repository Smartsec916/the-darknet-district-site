"""Build ignored, local Plug & Play cast GLBs from the supplied rigs and motion archive."""
import argparse
from pathlib import Path
import tempfile
import zipfile

import numpy as np

from retarget_world import GLB, add_clip, bare, qinv, qmul, qnorm, qrot, save, worlds


JOINTS = {
    "Hips": "root.x", "Spine": "spine_01.x", "Spine1": "spine_02.x",
    "Spine2": "spine_03.x", "Neck": "neck.x", "Head": "head.x",
}
AIM = {
    "Spine": "Spine1", "Spine1": "Spine2", "Spine2": "Neck", "Neck": "Head"
}
for side in ("Left", "Right"):
    suffix = "." + side[0].lower()
    JOINTS.update({side + joint: donor + suffix for joint, donor in (
        ("Shoulder", "shoulder"), ("Arm", "arm_stretch"),
        ("ForeArm", "forearm_stretch"), ("Hand", "hand"),
        ("UpLeg", "thigh_stretch"), ("Leg", "leg_stretch"),
        ("Foot", "foot"), ("ToeBase", "toes_01")
    )})
    AIM.update({side + a: side + b for a, b in (
        ("Shoulder", "Arm"), ("Arm", "ForeArm"), ("ForeArm", "Hand"),
        ("UpLeg", "Leg"), ("Leg", "Foot"), ("Foot", "ToeBase")
    )})


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True).clip(1e-8)


def swing(a, b):
    a, b = unit(a), unit(b)
    cross = np.cross(a, b)
    dot = np.sum(a * b, axis=-1, keepdims=True)
    alternative = np.cross(a, np.eye(3)[np.argmin(np.abs(a), axis=-1)])
    cross = np.where(dot < -0.99999, unit(alternative), cross)
    return qnorm(np.concatenate((cross, np.where(dot < -0.99999, 0, 1 + dot)), axis=-1))


def bake(target, donor, member):
    source = GLB(donor)
    clip = source.j["animations"][0]["name"]
    duration = max(track[0][-1] for track in source.anim(clip).values())
    times = np.linspace(0, duration, round(duration * 30) + 1)
    pose = worlds(source, times, clip)
    rest = worlds(target, np.zeros(1), None)
    joints = target.j["skins"][0]["joints"]
    joint = {bare(target.j["nodes"][i]["name"]): i for i in joints}
    out, rotation = {}, {}
    for i in sorted(joints, key=lambda j: len(target.chain(j))):
        name = bare(target.j["nodes"][i]["name"])
        parent = target.parent.get(i)
        parent_q = rotation.get(parent, rest[parent][1] if parent is not None else np.array([[0, 0, 0, 1.]]))
        _, local_q, _ = target.rest(i)
        world_q = qmul(parent_q, local_q)
        if name == "Hips":
            world_q = qmul(pose[source.byname["root.x"]][1], rest[i][1])
        if name in AIM:
            aim = AIM[name]
            dst = rest[joint[aim]][0] - rest[i][0]
            desired = pose[source.byname[JOINTS[aim]]][0] - pose[source.byname[JOINTS[name]]][0]
            world_q = qmul(swing(qrot(world_q, qrot(qinv(rest[i][1]), dst)), desired), world_q)
        rotation[i] = qnorm(np.broadcast_to(world_q, (len(times), 4)))
        values = qnorm(qmul(qinv(parent_q), rotation[i]))
        for frame in range(1, len(values)):
            if values[frame] @ values[frame - 1] < 0:
                values[frame] *= -1
        out[(i, "rotation")] = values

    hips = joint["Hips"]
    parent = target.parent[hips]
    root = pose[source.byname["root.x"]][0]
    # The two standing-entry clips share the same grip and stage coordinates.
    pole = np.array([-44.0, 0, 4.3])
    leg = sum(np.linalg.norm(rest[joint[a]][0] - rest[joint[b]][0]) for a, b in (
        ("LeftUpLeg", "LeftLeg"), ("LeftLeg", "LeftFoot")
    ))
    donor_leg = sum(np.linalg.norm(pose[source.byname[JOINTS[a]]][0][0] - pose[source.byname[JOINTS[b]]][0][0]) for a, b in (
        ("LeftUpLeg", "LeftLeg"), ("LeftLeg", "LeftFoot")
    ))
    pos = (root - pole) * (leg / donor_leg)
    pos[:, 1] += rest[hips][0][0, 1] - pos[0, 1]
    parent_p, parent_q, parent_s = (channel[0] for channel in rest[parent])
    local = qrot(qinv(parent_q), pos - parent_p) / parent_s
    out[(hips, "translation")] = local
    add_clip(target, member, times, out)


def service_pose(target, label, duration):
    times = np.linspace(0, duration, round(duration * 30) + 1)
    envelope = np.ones_like(times) if label == "CarryPose" else np.sin(np.pi * times / duration) ** 2
    rest = worlds(target, np.zeros(1), None)
    joints = target.j["skins"][0]["joints"]
    joint = {bare(target.j["nodes"][i]["name"]): i for i in joints}
    rotations, tracks = {}, {}
    for i in sorted(joints, key=lambda j: len(target.chain(j))):
        name = bare(target.j["nodes"][i]["name"])
        parent = target.parent.get(i)
        parent_q = rotations.get(parent, rest[parent][1] if parent is not None else np.array([[0, 0, 0, 1.]]))
        _, local_q, _ = target.rest(i)
        world_q = qmul(parent_q, local_q)
        if name in ("LeftArm", "RightArm", "LeftForeArm", "RightForeArm"):
            side = "Left" if name.startswith("Left") else "Right"
            axis = 1 if side == "Left" else -1
            upper = name == side + "Arm"
            child = joint[side + ("ForeArm" if upper else "Hand")]
            aim = np.repeat([[axis * .16, -1., .1]], len(times), axis=0)
            if label in ("Serving", "CarryPose") or (label == "Greeting" and side == "Left"):
                reach = 1. if label == "Greeting" else envelope
                aim[:, 2] += reach * (1.6 if upper else 3.3)
                aim[:, 1] += reach * (.5 if upper else 1.1)
            elif label == "Greeting" and side == "Right":
                aim[:, 1] += envelope * (.7 if upper else 2.1)
                aim[:, 2] += envelope * 1.5
                aim[:, 0] += envelope * np.sin(times * 12) * .25
            vector = rest[child][0] - rest[i][0]
            world_q = qmul(swing(qrot(world_q, qrot(qinv(rest[i][1]), vector)), aim), world_q)
        rotations[i] = qnorm(np.broadcast_to(world_q, (len(times), 4)))
        tracks[(i, "rotation")] = qnorm(qmul(qinv(parent_q), rotations[i]))
    hips = joint["Hips"]
    tracks[(hips, "translation")] = np.broadcast_to(target.rest(hips)[0], (len(times), 3))
    add_clip(target, label, times, tracks)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("ike", type=Path)
    parser.add_argument("eza", type=Path)
    parser.add_argument("--hosts", nargs=2, type=Path, metavar=("LYRA", "RAZE"))
    parser.add_argument("--nia", type=Path)
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[2] / "work" / "pole-preview"
    output.mkdir(parents=True, exist_ok=True)
    if args.nia:
        nia = GLB(args.nia)
        service_pose(nia, "Waiting", 2)
        save(nia, output / "nia.glb")
    if args.hosts:
        for name, source in zip(("lyra", "raze"), args.hosts):
            target = GLB(source)
            for label, duration in (("Waiting", 2), ("Greeting", 2.3), ("Serving", 2)):
                service_pose(target, label, duration)
            service_pose(target, "CarryPose", 1)
            source_walk = next(clip for clip in target.j["animations"] if clip["name"] == "Walking")
            arms = {i for i, n in enumerate(target.j["nodes"]) if bare(n.get("name")) in {
                "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand"
            }}
            carry = target.j["animations"].pop()
            offset = len(source_walk["samplers"])
            carry["name"] = "CarryWalk"
            carry["samplers"] = source_walk["samplers"] + carry["samplers"]
            arm_channels = [dict(channel, sampler=channel["sampler"] + offset) for channel in carry["channels"]
                            if channel["target"]["node"] in arms]
            carry["channels"] = [channel for channel in source_walk["channels"]
                                 if channel["target"]["node"] not in arms] + arm_channels
            target.j["animations"].append(carry)
            save(target, output / (name + ".glb"))
    with zipfile.ZipFile(args.archive) as archive, tempfile.TemporaryDirectory() as temp:
        donor = Path(temp) / "motion.glb"
        for identity, model, source in (
            ("ike", args.ike, "KickPole.glb"),
            ("eza", args.eza, "No-FeetSPin.glb"),
        ):
            donor.write_bytes(archive.read(source))
            target = GLB(model)
            service_pose(target, "Waiting", 2)
            bake(target, donor, "PoleDance")
            save(target, output / (identity + ".glb"))
            print(f"{identity}: {source} -> local rehearsal model")


if __name__ == "__main__":
    main()

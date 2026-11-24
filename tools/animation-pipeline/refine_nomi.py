"""Refine the recovered Nomi mesh while preserving her source rig, clips and materials."""
from pathlib import Path
import argparse
import hashlib
import numpy as np
from retarget_world import GLB, save


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def reshape(points):
    x, y, z = points.T
    cheek = np.exp(-((y - .771) / .069) ** 2)
    central = 1 - smooth((abs(x) - .070) / .05)
    face = smooth((z + .025) / .07) * central
    return np.column_stack((x * (1 + .125 * cheek * face), y, z + .003 * cheek * face))


def write_attribute(model, index, values):
    a = model.j['accessors'][index]
    v = model.j['bufferViews'][a['bufferView']]
    dtype = {5126: '<f4', 5123: '<u2', 5121: 'u1'}[a['componentType']]
    arr = np.asarray(values, dtype=dtype)
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    target = np.ndarray(arr.shape, dtype=dtype, buffer=model.bin, offset=offset,
                        strides=(v.get('byteStride', arr.strides[0]), arr.strides[1]))
    target[:] = arr
    if 'min' in a:
        a['min'], a['max'] = arr.min(0).tolist(), arr.max(0).tolist()


def refine(source, output):
    if output.exists():
        raise ValueError('Choose a new output file to preserve previous versions.')
    g = GLB(source)
    attr = g.j['meshes'][0]['primitives'][0]['attributes']
    p = g.acc(attr['POSITION'])
    if hashlib.sha256(p.astype('<f4').tobytes()).hexdigest() != '25eac7e93751693d1a80e0b0e5a980a27d19168489be6dcf8da2e40446cd6cec':
        raise ValueError('The mesh differs from the recovered Nomi source.')
    positions = reshape(p)
    # Transform authored split normals with the local inverse transpose.
    eps = 1e-5
    jac = np.stack([(reshape(p + axis) - reshape(p - axis)) / (2 * eps)
                    for axis in np.eye(3) * eps], axis=2)
    normals = np.linalg.solve(jac.transpose(0, 2, 1), g.acc(attr['NORMAL'])[:, :, None])[:, :, 0]
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-12)
    joints = g.j['skins'][0]['joints']
    head = joints.index(g.byname['Head'])
    ids = g.acc(attr['JOINTS_0']).astype(int)
    weights = g.acc(attr['WEIGHTS_0'])
    # Rigid skull above the jaw, smooth transition at the nape. Exclude hanging hair.
    x, y, _ = p.T
    influence = smooth((y - .688) / .055) * (1 - smooth((abs(x) - .084) / .040))
    dense = np.zeros((len(p), len(joints)))
    np.add.at(dense, (np.arange(len(p))[:, None], ids), weights * (1 - influence[:, None]))
    dense[:, head] += influence
    selected = np.argsort(-dense, axis=1, kind='stable')[:, :4]
    result = np.take_along_axis(dense, selected, axis=1)
    result /= result.sum(axis=1, keepdims=True)
    for key, values in [('POSITION', positions), ('NORMAL', normals), ('JOINTS_0', selected), ('WEIGHTS_0', result)]:
        write_attribute(g, attr[key], values)
    save(g, str(output))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    refine(args.source, args.output)

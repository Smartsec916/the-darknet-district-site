
#!/usr/bin/env python3
import os
import shutil
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS
import mutagen
from mutagen.id3 import ID3NoHeaderError
import PyPDF2
import io

def remove_image_metadata(file_path):
    """Remove metadata from image files"""
    try:
        with Image.open(file_path) as image:
            # Create a new image without EXIF data
            data = list(image.getdata())
            image_without_exif = Image.new(image.mode, image.size)
            image_without_exif.putdata(data)
            
            # Save the image without metadata
            image_without_exif.save(file_path, quality=95, optimize=True)
            print(f"✓ Removed metadata from {file_path}")
            return True
    except Exception as e:
        print(f"✗ Error processing image {file_path}: {e}")
        return False

def remove_audio_metadata(file_path):
    """Remove metadata from audio files"""
    try:
        audiofile = mutagen.File(file_path)
        if audiofile is not None:
            audiofile.delete()
            audiofile.save()
            print(f"✓ Removed metadata from {file_path}")
            return True
        else:
            print(f"✗ Could not process audio file {file_path}")
            return False
    except Exception as e:
        print(f"✗ Error processing audio {file_path}: {e}")
        return False

def remove_pdf_metadata(file_path):
    """Remove metadata from PDF files"""
    try:
        with open(file_path, 'rb') as input_file:
            reader = PyPDF2.PdfReader(input_file)
            writer = PyPDF2.PdfWriter()
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Remove metadata
            writer.add_metadata({})
            
            # Write to temporary file then replace original
            temp_path = file_path + '.tmp'
            with open(temp_path, 'wb') as output_file:
                writer.write(output_file)
            
            shutil.move(temp_path, file_path)
            print(f"✓ Removed metadata from {file_path}")
            return True
    except Exception as e:
        print(f"✗ Error processing PDF {file_path}: {e}")
        return False

def process_directory(directory_path):
    """Process all files in a directory"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.gif'}
    audio_extensions = {'.mp3', '.flac', '.ogg', '.m4a', '.wma', '.wav'}
    pdf_extensions = {'.pdf'}
    
    processed = 0
    errors = 0
    
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            file_ext = Path(file).suffix.lower()
            
            if file_ext in image_extensions:
                if remove_image_metadata(file_path):
                    processed += 1
                else:
                    errors += 1
            elif file_ext in audio_extensions:
                if remove_audio_metadata(file_path):
                    processed += 1
                else:
                    errors += 1
            elif file_ext in pdf_extensions:
                if remove_pdf_metadata(file_path):
                    processed += 1
                else:
                    errors += 1
            else:
                print(f"⚠ Skipped unsupported file type: {file_path}")
    
    return processed, errors

def main():
    print("🔧 Starting metadata removal process...")
    
    # Process both assets directories
    directories = ['assets', 'attached_assets', 'static/assets', 'static/attached_assets']
    total_processed = 0
    total_errors = 0
    
    for directory in directories:
        if os.path.exists(directory):
            print(f"\n📁 Processing directory: {directory}")
            processed, errors = process_directory(directory)
            total_processed += processed
            total_errors += errors
        else:
            print(f"⚠ Directory not found: {directory}")
    
    print(f"\n✅ Metadata removal complete!")
    print(f"📊 Files processed: {total_processed}")
    print(f"❌ Errors: {total_errors}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Download all external libraries for Goal Setting Framework
Run this script to download all required CSS and JS libraries locally
"""

import requests
import os
from pathlib import Path

# Create directories
def create_directories():
    directories = ['css', 'js', 'fonts']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
    print("✅ Directories created")

# Download file from URL
def download_file(url, filepath):
    try:
        print(f"📥 Downloading: {filepath}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as file:
            file.write(response.content)
        print(f"✅ Downloaded: {filepath}")
        return True
    except Exception as e:
        print(f"❌ Failed to download {filepath}: {e}")
        return False

# Main download function
def download_libraries():
    libraries = [
        # CSS Libraries
        {
            'url': 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'file': 'css/bootstrap.min.css'
        },
        {
            'url': 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
            'file': 'css/select2.min.css'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
            'file': 'css/font-awesome.min.css'
        },
        
        # JavaScript Libraries
        {
            'url': 'https://code.jquery.com/jquery-3.6.0.min.js',
            'file': 'js/jquery-3.6.0.min.js'
        },
        {
            'url': 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
            'file': 'js/select2.min.js'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.4/xlsx.full.min.js',
            'file': 'js/xlsx.full.min.js'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
            'file': 'js/jszip.min.js'
        },
        
        # Font Awesome Fonts
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-solid-900.woff2',
            'file': 'fonts/fa-solid-900.woff2'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-solid-900.woff',
            'file': 'fonts/fa-solid-900.woff'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-regular-400.woff2',
            'file': 'fonts/fa-regular-400.woff2'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-regular-400.woff',
            'file': 'fonts/fa-regular-400.woff'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-brands-400.woff2',
            'file': 'fonts/fa-brands-400.woff2'
        },
        {
            'url': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/fa-brands-400.woff',
            'file': 'fonts/fa-brands-400.woff'
        }
    ]
    
    successful_downloads = 0
    total_downloads = len(libraries)
    
    for library in libraries:
        if download_file(library['url'], library['file']):
            successful_downloads += 1
    
    print(f"\n📊 Download Summary:")
    print(f"✅ Successfully downloaded: {successful_downloads}/{total_downloads}")
    
    if successful_downloads == total_downloads:
        print("🎉 All libraries downloaded successfully!")
    else:
        print("⚠️ Some downloads failed. Check your internet connection.")

# Fix Font Awesome CSS file to use local fonts
def fix_font_awesome_css():
    css_file = 'css/font-awesome.min.css'
    if os.path.exists(css_file):
        try:
            with open(css_file, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Replace CDN font URLs with local paths
            content = content.replace(
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/webfonts/',
                '../fonts/'
            )
            
            with open(css_file, 'w', encoding='utf-8') as file:
                file.write(content)
            
            print("✅ Fixed Font Awesome CSS to use local fonts")
        except Exception as e:
            print(f"❌ Failed to fix Font Awesome CSS: {e}")

if __name__ == "__main__":
    print("🚀 Goal Setting Framework - Library Downloader")
    print("=" * 50)
    
    create_directories()
    download_libraries()
    fix_font_awesome_css()
    
    print("\n🎯 Next Steps:")
    print("1. Copy all your JavaScript files to the js/ folder")
    print("2. Copy your main.css to the css/ folder")
    print("3. Use the updated index.html with local references")
    print("4. Upload everything to GitHub")
    print("\n✅ Ready for offline deployment!")
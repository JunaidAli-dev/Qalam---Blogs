// src/components/WordLikeEditor.js
import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';

const WordLikeEditor = ({ formData, setFormData, onSubmit, isSubmitting, editingId, resetForm }) => {
  const [uploadProgress, setUploadProgress] = useState(false);
  const editorRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadProgress(true);
    const formDataUpload = new FormData();
    
    Array.from(files).forEach(file => {
      formDataUpload.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/upload', formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.files) {
        const editor = editorRef.current;
        response.data.files.forEach(file => {
          const fileType = file.originalName.split('.').pop().toLowerCase();
          
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
            editor.insertContent(`<img src="${file.url}" alt="${file.originalName}" style="max-width: 100%; height: auto;" />`);
          } else if (['mp4', 'webm', 'ogg'].includes(fileType)) {
            editor.insertContent(`<video controls style="max-width: 100%;"><source src="${file.url}" type="video/${fileType}">Your browser does not support the video tag.</video>`);
          } else {
            editor.insertContent(`<a href="${file.url}" target="_blank">${file.originalName}</a>`);
          }
        });
        alert(`${response.data.files.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadProgress(false);
    }
  };

  const getWordCount = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent({ format: 'text' });
      return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    return 0;
  };

  const getReadingTime = () => {
    const wordCount = getWordCount();
    return Math.ceil(wordCount / 200);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <span className="text-2xl">📝</span>
            <span>{editingId ? 'Edit Post' : 'Create New Post'}</span>
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="fileUpload"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={uploadProgress}
            />
            <label
              htmlFor="fileUpload"
              className={`px-4 py-2 text-sm border rounded-lg cursor-pointer transition-colors shadow-sm ${
                uploadProgress 
                  ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:shadow-md'
              }`}
            >
              {uploadProgress ? '⏳ Uploading...' : '📎 Upload Files'}
            </label>
            
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded border shadow-sm">
              <span className="font-medium">Words:</span> {getWordCount()} | 
              <span className="font-medium"> Read time:</span> ~{getReadingTime()} min
            </div>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Info */}
        <div className="mt-3 p-3 bg-white rounded-lg border">
          <div className="text-xs text-gray-600">
            <strong className="text-gray-800">⌨️ Keyboard Shortcuts:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+B</kbd> Bold</span>
              <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+I</kbd> Italic</span>
              <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+U</kbd> Underline</span>
              <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+K</kbd> Link</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Post Title *
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter an engaging title for your post..."
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Content *
          </label>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <Editor
              apiKey="x7imb9hgqpf8besntzr16n3x9i75blw4gznza0cwcjplecf6"
              onInit={(evt, editor) => {
                editorRef.current = editor;
                console.log('TinyMCE initialized successfully');
              }}
              value={formData.content}
              onEditorChange={(content) => setFormData({...formData, content})}
              init={{
                height: 500,
                menubar: 'file edit view insert format tools table help',
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
                ],
                toolbar1: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | fontcolor backcolor',
                toolbar2: 'alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor removeformat',
                toolbar3: 'link image media table | insertdatetime | searchreplace | code fullscreen preview | help | emoticons',
                content_style: `
                  body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    font-size: 14px; 
                    line-height: 1.6; 
                    color: #333;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                  }
                  h1, h2, h3, h4, h5, h6 { 
                    color: #2c3e50; 
                    margin-top: 1.5em; 
                    margin-bottom: 0.5em; 
                  }
                  h1 { font-size: 2.5em; font-weight: 700; }
                  h2 { font-size: 2em; font-weight: 600; }
                  h3 { font-size: 1.5em; font-weight: 600; }
                  p { margin-bottom: 1em; }
                  img { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                  table td, table th { border: 1px solid #ddd; padding: 8px; }
                  table th { background-color: #f2f2f2; font-weight: bold; }
                  blockquote { 
                    border-left: 4px solid #3498db; 
                    padding-left: 1em; 
                    margin: 1em 0; 
                    font-style: italic; 
                    color: #666; 
                    background-color: #f8f9fa;
                    padding: 1em;
                    border-radius: 4px;
                  }
                  code { 
                    background-color: #f4f4f4; 
                    padding: 2px 4px; 
                    border-radius: 3px; 
                    font-family: 'Courier New', monospace; 
                    font-size: 0.9em;
                  }
                `,
                setup: (editor) => {
                  // Remove the problematic setMode calls
                  editor.on('init', () => {
                    console.log('TinyMCE editor ready');
                  });
                  
                  // Keyboard shortcuts
                  editor.addShortcut('ctrl+b', 'Bold text', () => {
                    editor.execCommand('Bold');
                  });
                  
                  editor.addShortcut('ctrl+i', 'Italic text', () => {
                    editor.execCommand('Italic');
                  });
                  
                  editor.addShortcut('ctrl+u', 'Underline text', () => {
                    editor.execCommand('Underline');
                  });
                  
                  editor.addShortcut('ctrl+k', 'Insert link', () => {
                    editor.execCommand('mceLink');
                  });
                  
                  editor.addShortcut('ctrl+1', 'Heading 1', () => {
                    editor.execCommand('FormatBlock', false, 'h1');
                  });
                  
                  editor.addShortcut('ctrl+2', 'Heading 2', () => {
                    editor.execCommand('FormatBlock', false, 'h2');
                  });
                  
                  editor.addShortcut('ctrl+3', 'Heading 3', () => {
                    editor.execCommand('FormatBlock', false, 'h3');
                  });
                  
                  editor.addShortcut('ctrl+s', 'Save draft', () => {
                    localStorage.setItem('blog_draft', JSON.stringify(formData));
                    editor.notificationManager.open({
                      text: '💾 Draft saved locally!',
                      type: 'success',
                      timeout: 2000
                    });
                  });
                },
                // Image upload configuration
                images_upload_handler: (blobInfo, progress) => {
                  return new Promise(async (resolve, reject) => {
                    try {
                      const formDataUpload = new FormData();
                      formDataUpload.append('files', blobInfo.blob(), blobInfo.filename());
                      
                      const token = localStorage.getItem('token');
                      const response = await axios.post('http://localhost:3001/api/upload', formDataUpload, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'multipart/form-data'
                        },
                        onUploadProgress: (progressEvent) => {
                          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                          progress(percentCompleted);
                        }
                      });

                      if (response.data.files && response.data.files.length > 0) {
                        resolve(response.data.files[0].url);
                      } else {
                        reject('Upload failed');
                      }
                    } catch (error) {
                      console.error('Upload failed:', error);
                      reject('Upload failed: ' + (error.response?.data?.message || error.message));
                    }
                  });
                },
                automatic_uploads: true,
                images_reuse_filename: true,
                file_picker_types: 'image',
                
                // Table features
                table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
                table_appearance_options: false,
                table_grid: false,
                table_resize_bars: true,
                
                // Status bar
                statusbar: true,
                elementpath: false,
                branding: false,
                
                // Paste options
                paste_as_text: false,
                paste_auto_cleanup_on_paste: true,
                
                // Spell checker
                browser_spellcheck: true,
                
                // Resize options
                resize: true,
                min_height: 400,
                max_height: 800
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button 
              type="submit"
              disabled={isSubmitting || uploadProgress}
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingId ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {editingId ? '✏️ Update Post' : '🚀 Publish Post'}
                </>
              )}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                ❌ Cancel Edit
              </button>
            )}
          </div>

          {/* Additional Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm hover:shadow-md"
              onClick={() => {
                localStorage.setItem('blog_draft', JSON.stringify(formData));
                alert('💾 Draft saved locally!');
              }}
            >
              💾 Save Draft
            </button>
            
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm hover:shadow-md"
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.execCommand('mceFullScreen');
                }
              }}
            >
              ⛶ Fullscreen
            </button>
            
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm hover:shadow-md"
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.execCommand('mcePreview');
                }
              }}
            >
              👁️ Preview
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WordLikeEditor;

import React, { useState } from 'react';
import { Download, Check, Loader } from 'lucide-react';
import { ComicProject } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Step5Props {
  project: ComicProject;
}

export const Step5Export: React.FC<Step5Props> = ({ project }) => {
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPngGenerating, setIsPngGenerating] = useState(false);

  const handlePdfExport = async () => {
    setIsPdfGenerating(true);
    
    try {
      // Create a new PDF document with proper comic book dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [595.28, 841.89] // A4 size in points
      });
      
      // Set default font
      pdf.setFont('helvetica');
      
      // Process each page
      for (let pageIndex = 0; pageIndex < project.pages.length; pageIndex++) {
        const page = project.pages[pageIndex];
        
        // Add a new page after the first one
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Add page title/header
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${project.title} - Page ${pageIndex + 1}`, 40, 40);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        
        // Calculate layout based on number of scenes (create a grid layout for the page)
        let currentY = 60;
        const pageMargin = 40;
        const imageHeight = 180;
        const textHeight = 20;
        
        for (let sceneIndex = 0; sceneIndex < page.scenes.length; sceneIndex++) {
          const scene = page.scenes[sceneIndex];
          
          if (scene.imageUrl) {
            // Create a temporary image to get its properties
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = scene.imageUrl;
            
            // Wait for image to load
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            // Get image properties
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            // Calculate dimensions maintaining aspect ratio
            const maxWidth = pdf.internal.pageSize.getWidth() - (pageMargin * 2);
            let displayWidth = maxWidth;
            let displayHeight = (imgHeight * displayWidth) / imgWidth;
            
            // If image is too tall for the available space, scale it down
            const availableHeight = pdf.internal.pageSize.getHeight() - currentY - 60;
            if (displayHeight > availableHeight) {
              displayHeight = availableHeight;
              displayWidth = (imgWidth * displayHeight) / imgHeight;
            }
            
            // Add image to PDF
            pdf.addImage(img, 'PNG', pageMargin, currentY, displayWidth, displayHeight);
            currentY += displayHeight + 10;
          }
          
          // Add narrator text if it exists
          if (scene.narrator) {
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'italic');
            const narratorLines = pdf.splitTextToSize(scene.narrator, pdf.internal.pageSize.getWidth() - (pageMargin * 2));
            narratorLines.forEach((line: string) => {
              if (currentY > pdf.internal.pageSize.getHeight() - 40) {
                // Add a new page if needed
                pdf.addPage();
                currentY = 40;
              }
              pdf.text(line, pageMargin, currentY);
              currentY += textHeight * 0.8;
            });
            pdf.setFont(undefined, 'normal');
          }
          
          // Add dialogue
          for (const dialogue of scene.dialogue) {
            if (currentY > pdf.internal.pageSize.getHeight() - 40) {
              // Add a new page if needed
              pdf.addPage();
              currentY = 40;
            }
            
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            const characterText = `${dialogue.character}:`;
            pdf.text(characterText, pageMargin, currentY);
            
            // Get the width of the character text to position the dialogue
            const charWidth = pdf.getTextWidth(characterText);
            pdf.setFont(undefined, 'normal');
            const dialogueText = dialogue.line;
            const dialogueLines = pdf.splitTextToSize(dialogueText, pdf.internal.pageSize.getWidth() - (pageMargin * 2) - charWidth - 10);
            
            // Position the dialogue text next to the character name for the first line
            if (dialogueLines.length > 0) {
              pdf.text(dialogueLines[0], pageMargin + charWidth + 10, currentY);
              currentY += textHeight * 0.8;
              
              // For subsequent lines, align with the dialogue text (not the character name)
              for (let i = 1; i < dialogueLines.length; i++) {
                if (currentY > pdf.internal.pageSize.getHeight() - 40) {
                  // Add a new page if needed
                  pdf.addPage();
                  currentY = 40;
                }
                pdf.text(dialogueLines[i], pageMargin + charWidth + 10, currentY);
                currentY += textHeight * 0.8;
              }
            } else {
              currentY += textHeight * 0.8;
            }
          }
          
          // Add some space between scenes
          currentY += 20;
          
          // Add a new page if we're running out of space
          if (currentY > pdf.internal.pageSize.getHeight() - 40) {
            pdf.addPage();
            currentY = 40;
          }
        }
      }
      
      // Save the PDF
      pdf.save(`${project.title.replace(/\s+/g, '_')}_comic.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error as Error).message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePngExport = async () => {
    setIsPngGenerating(true);
    
    try {
      // Create a container for each page to convert to image
      for (let pageIndex = 0; pageIndex < project.pages.length; pageIndex++) {
        const page = project.pages[pageIndex];
        
        // Create a temporary HTML element to render the page with proper comic layout
        const pageContainer = document.createElement('div');
        pageContainer.style.position = 'absolute';
        pageContainer.style.left = '-9999px';
        pageContainer.style.width = '800px';
        pageContainer.style.minHeight = '1200px';
        pageContainer.style.backgroundColor = 'white';
        pageContainer.style.padding = '20px';
        pageContainer.style.fontFamily = 'Arial, sans-serif';
        pageContainer.style.boxSizing = 'border-box';
        document.body.appendChild(pageContainer);
        
        // Add page header
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        header.style.paddingBottom = '10px';
        header.style.borderBottom = '2px solid #ccc';
        header.innerHTML = `<h2 style="margin: 0; font-size: 24px; color: #333;">${project.title}</h2>
                            <p style="margin: 5px 0 0 0; font-size: 16px; color: #666;">Page ${pageIndex + 1}</p>`;
        pageContainer.appendChild(header);
        
        // Add each scene in a more structured way
        for (let sceneIndex = 0; sceneIndex < page.scenes.length; sceneIndex++) {
          const scene = page.scenes[sceneIndex];
          
          const sceneContainer = document.createElement('div');
          sceneContainer.style.marginBottom = '25px';
          sceneContainer.style.pageBreakInside = 'avoid';
          
          // Add image if available
          if (scene.imageUrl) {
            const imgContainer = document.createElement('div');
            imgContainer.style.textAlign = 'center';
            imgContainer.style.marginBottom = '10px';
            
            const img = document.createElement('img');
            img.src = scene.imageUrl;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '500px';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            imgContainer.appendChild(img);
            
            sceneContainer.appendChild(imgContainer);
          }
          
          // Add narrator text with bubble styling
          if (scene.narrator) {
            const narratorDiv = document.createElement('div');
            narratorDiv.style.backgroundColor = '#fff8dc'; // Light yellow for narrator
            narratorDiv.style.border = '1px solid #d4c49e';
            narratorDiv.style.borderRadius = '8px';
            narratorDiv.style.padding = '10px';
            narratorDiv.style.margin = '10px 0';
            narratorDiv.style.fontStyle = 'italic';
            narratorDiv.style.textAlign = 'center';
            narratorDiv.style.fontWeight = '500';
            narratorDiv.innerHTML = `<span style="font-weight: bold;">Narrator:</span> ${scene.narrator}`;
            sceneContainer.appendChild(narratorDiv);
          }
          
          // Add dialogue in a structured way
          if (scene.dialogue.length > 0) {
            const dialogueContainer = document.createElement('div');
            dialogueContainer.style.marginTop = '10px';
            
            scene.dialogue.forEach(dialogue => {
              const dialogueDiv = document.createElement('div');
              dialogueDiv.style.margin = '5px 0';
              dialogueDiv.style.padding = '8px';
              dialogueDiv.style.backgroundColor = '#f0f8ff'; // Light blue for dialogue
              dialogueDiv.style.border = '1px solid #a0c4e8';
              dialogueDiv.style.borderRadius = '6px';
              dialogueDiv.innerHTML = `<strong style="color: #2c5aa0;">${dialogue.character}:</strong> ${dialogue.line}`;
              dialogueContainer.appendChild(dialogueDiv);
            });
            
            sceneContainer.appendChild(dialogueContainer);
          }
          
          // Add scene separator if not the last scene
          if (sceneIndex < page.scenes.length - 1) {
            const separator = document.createElement('hr');
            separator.style.border = '0';
            separator.style.height = '1px';
            separator.style.backgroundColor = '#ddd';
            separator.style.margin = '15px 0';
            sceneContainer.appendChild(separator);
          }
          
          pageContainer.appendChild(sceneContainer);
        }
        
        // Convert to canvas and download with high quality
        const canvas = await html2canvas(pageContainer, {
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white'
        });
        
        const image = canvas.toDataURL('image/png');
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${project.title.replace(/\s+/g, '_')}_page_${pageIndex + 1}.png`;
        link.href = image;
        link.click();
        
        // Remove the temporary container
        document.body.removeChild(pageContainer);
      }
    } catch (error) {
      console.error('Error generating PNGs:', error);
      alert('Error generating PNGs: ' + (error as Error).message);
    } finally {
      setIsPngGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center pt-10">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Comic Ready!</h2>
        <p className="text-gray-500 mt-2">Your masterpiece "{project.title}" is assembled and ready to publish.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex flex-col justify-center items-center space-y-4">
            <h3 className="text-xl font-bold">Download Files</h3>
            <p className="text-sm text-gray-500 max-w-xs">Get high-resolution PDF or individual image files for printing.</p>
            
            <button 
                onClick={handlePdfExport}
                disabled={isPdfGenerating}
                className="w-64 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-75"
            >
                {isPdfGenerating ? <><Loader className="w-5 h-5 animate-spin" /> Generating...</> : <><Download className="w-5 h-5" /> Download PDF</>}
            </button>
            <button 
                onClick={handlePngExport}
                disabled={isPngGenerating}
                className="w-64 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-75"
            >
                {isPngGenerating ? <><Loader className="w-5 h-5 animate-spin" /> Generating...</> : <><Download className="w-5 h-5" /> Download PNGs</>}
            </button>
        </div>

        <div className="flex flex-col justify-center items-center space-y-4">
            <h3 className="text-xl font-bold">Share Online</h3>
            <p className="text-sm text-gray-500 max-w-xs">Your comic has been saved to local storage.</p>
            
            <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-gray-100 rounded-lg">
                    <p className="text-gray-600">Comic saved locally</p>
                    <p className="text-sm text-gray-500 mt-2">Available in browser storage</p>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Project saved to local storage.</p>
        </div>
      </div>

      <div className="mt-12 opacity-50 pointer-events-none grayscale blur-[1px] transform scale-90 origin-top">
         {/* Preview of the first page logic reused strictly for visual filler */}
         <div className="mx-auto w-[300px] h-[450px] bg-white border border-black grid grid-cols-2 grid-rows-2 gap-1 p-1">
             <div className="bg-gray-200 border border-black"></div>
             <div className="bg-gray-300 border border-black"></div>
             <div className="bg-gray-400 border border-black col-span-2"></div>
         </div>
         <p className="mt-2 text-sm font-bold">Preview: Page 1</p>
      </div>
    </div>
  );
};

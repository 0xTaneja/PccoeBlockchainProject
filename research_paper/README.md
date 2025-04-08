# ElizaEdu Research Paper

This repository contains the LaTeX source files for the research paper "ElizaEdu: AI-powered Web3 System for Automated, Secure Event Attendance Verification" by Sarthak Nimje, Rushab Taneja, Om Baviskar, and Dr. Rachana Patil from Pimpri Chinchwad College of Engineering, Pune.

## Files

- `ElizaEdu_Paper.tex`: Main LaTeX document
- `system_architecture.tex`: TikZ source for the system architecture diagram (Figure 1)
- `workflow_diagram.tex`: TikZ source for the workflow diagram

## How to Compile

### Using Overleaf

1. Create a new project on [Overleaf](https://www.overleaf.com)
2. Upload all files from this directory
3. Set `ElizaEdu_Paper.tex` as the main document
4. Click "Compile" to generate the PDF

### Using Local LaTeX Installation

To compile the diagrams separately (required before compiling the main document):

```bash
pdflatex system_architecture.tex
pdflatex workflow_diagram.tex
```

Then compile the main document:

```bash
pdflatex ElizaEdu_Paper.tex
pdflatex ElizaEdu_Paper.tex  # Run twice for proper references
```

## Required Packages

The following LaTeX packages are required:
- graphicx
- times
- amsmath
- amssymb
- hyperref
- caption
- float
- geometry
- tikz (with libraries: arrows, shapes, positioning, shadows, trees, fit, backgrounds)

## Author Images

To complete the document, you'll need to add author photos as the following files:
- `sarthak_photo.jpg`
- `rushab_photo.jpg`
- `om_photo.jpg`
- `rachana_photo.jpg`

Each image should be formatted as a square with dimensions of approximately 200x200 pixels. 
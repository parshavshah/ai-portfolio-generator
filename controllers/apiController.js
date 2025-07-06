import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    // Use OpenAI to extract structured data
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Extract information from the resume text and return it as a JSON object with the following structure:
          {
            "name": "Full Name",
            "title": "Professional Title",
            "email": "email@example.com",
            "phone": "Phone Number",
            "location": "City, State",
            "summary": "Professional summary or bio",
            "experience": [
              {
                "company": "Company Name",
                "position": "Job Title",
                "duration": "Start Date - End Date",
                "description": "Job description and achievements"
              }
            ],
            "education": [
              {
                "institution": "School Name",
                "degree": "Degree Type",
                "field": "Field of Study",
                "year": "Graduation Year"
              }
            ],
            "skills": ["skill1", "skill2", "skill3"],
            "projects": [
              {
                "name": "Project Name",
                "description": "Project description",
                "technologies": ["tech1", "tech2"]
              }
            ]
          }
          
          Extract as much information as possible. If some fields are not available, use reasonable defaults or leave them empty.`
        },
        {
          role: "user",
          content: `Please extract information from this resume:\n\n${resumeText}`
        }
      ],
      temperature: 0.3
    });

    const extractedData = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
};

export const generatePortfolio = (req, res) => {
  try {
    const portfolioData = req.body;
    const portfolioId = Date.now().toString();
    req.session.portfolioData = {
      id: portfolioId,
      data: portfolioData,
      timestamp: Date.now()
    };
    res.json({ success: true, portfolioId: portfolioId });
  } catch (error) {
    console.error('Error generating portfolio:', error);
    res.status(500).json({ error: 'Failed to generate portfolio' });
  }
};

export const downloadPortfolio = (req, res) => {
  try {
    const portfolioData = req.session.portfolioData;
    if (!portfolioData) {
      return res.status(404).json({ error: 'Portfolio not found. Please generate a new portfolio.' });
    }
    const data = portfolioData.data;
    // Read CSS and JS files
    const portfolioCss = fs.readFileSync(path.join(__dirname, '../public/portfolio.css'), 'utf8');
    const portfolioJs = fs.readFileSync(path.join(__dirname, '../public/portfolio.js'), 'utf8');
    // Generate complete HTML with embedded styles and scripts
    const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Portfolio'} - Professional Portfolio</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
${portfolioCss}
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">${data.name || 'Portfolio'}</div>
            <div class="nav-links">
                <a href="#about">About</a>
                <a href="#experience">Experience</a>
                <a href="#education">Education</a>
                <a href="#skills">Skills</a>
                ${data.projects && data.projects.length > 0 ? '<a href="#projects">Projects</a>' : ''}
                <a href="#contact">Contact</a>
            </div>
        </div>
    </nav>
    <section class="hero">
        <div class="hero-content">
            <h1 class="hero-name">${data.name || 'Your Name'}</h1>
            <p class="hero-title">${data.title || 'Professional Title'}</p>
            ${data.location ? `<p class="hero-location">${data.location}</p>` : ''}
            <div class="hero-actions">
                ${data.email ? `<a href="mailto:${data.email}" class="btn btn-primary">Get In Touch</a>` : ''}
                <button onclick="window.print()" class="btn btn-secondary">Print Portfolio</button>
            </div>
        </div>
    </section>
    <section id="about" class="section">
        <div class="container">
            <h2 class="section-title">About Me</h2>
            <div class="about-content">
                <p>${data.summary || 'Professional summary will appear here.'}</p>
            </div>
        </div>
    </section>
    <section id="experience" class="section section-gray">
        <div class="container">
            <h2 class="section-title">Experience</h2>
            <div class="experience-grid">
                ${data.experience && data.experience.length > 0 ? data.experience.map(exp => `
                <div class="experience-card">
                    <div class="experience-header">
                        <h3 class="experience-title">${exp.position || 'Position'}</h3>
                        <div class="experience-company">${exp.company || 'Company'}</div>
                        <div class="experience-duration">${exp.duration || 'Duration'}</div>
                    </div>
                    <div class="experience-description">
                        <p>${exp.description || 'Job description and achievements.'}</p>
                    </div>
                </div>
                `).join('') : '<p>No experience data available.</p>'}
            </div>
        </div>
    </section>
    <section id="education" class="section">
        <div class="container">
            <h2 class="section-title">Education</h2>
            <div class="education-grid">
                ${data.education && data.education.length > 0 ? data.education.map(edu => `
                <div class="education-card">
                    <h3 class="education-degree">${edu.degree || 'Degree'} ${edu.field ? 'in ' + edu.field : ''}</h3>
                    <div class="education-institution">${edu.institution || 'Institution'}</div>
                    <div class="education-year">${edu.year || 'Year'}</div>
                </div>
                `).join('') : '<p>No education data available.</p>'}
            </div>
        </div>
    </section>
    <section id="skills" class="section section-gray">
        <div class="container">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                ${data.skills && data.skills.length > 0 ? data.skills.map(skill => `
                <div class="skill-item">${skill}</div>
                `).join('') : '<p>No skills data available.</p>'}
            </div>
        </div>
    </section>
    ${data.projects && data.projects.length > 0 ? `
    <section id="projects" class="section">
        <div class="container">
            <h2 class="section-title">Projects</h2>
            <div class="projects-grid">
                ${data.projects.map(project => `
                <div class="project-card">
                    <h3 class="project-title">${project.name || 'Project Name'}</h3>
                    <p class="project-description">${project.description || 'Project description.'}</p>
                    ${project.technologies && project.technologies.length > 0 ? `
                    <div class="project-technologies">
                        ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}
    <section id="contact" class="section section-dark">
        <div class="container">
            <h2 class="section-title">Get In Touch</h2>
            <div class="contact-content">
                ${data.email ? `<p class="contact-item">📧 ${data.email}</p>` : ''}
                ${data.phone ? `<p class="contact-item">📱 ${data.phone}</p>` : ''}
                ${data.location ? `<p class="contact-item">📍 ${data.location}</p>` : ''}
            </div>
        </div>
    </section>
    <script>
${portfolioJs}
    </script>
</body>
</html>`;
    // Set headers for file download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${data.name || 'portfolio'}-portfolio.html"`);
    res.send(completeHtml);
  } catch (error) {
    console.error('Error generating downloadable portfolio:', error);
    res.status(500).json({ error: 'Failed to generate downloadable portfolio' });
  }
}; 
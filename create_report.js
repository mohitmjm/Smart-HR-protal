const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Calibri", color: "2E74B5" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Calibri", color: "365F91" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 150 },
    children: [new TextRun({ text, size: 24, font: "Calibri", ...opts })]
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 24, font: "Calibri" })]
  });
}

function gap() {
  return new Paragraph({ children: [new TextRun("")] });
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      gap(), gap(), gap(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Smart HR Portal", bold: true, size: 56, font: "Calibri", color: "1F3864" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Project Report", size: 36, font: "Calibri", color: "2E74B5" })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      h1("1. Project Name"),
      p("Smart HR Portal"),
      
      h1("2. Aim"),
      p("To revolutionize human resource management by providing an intelligent, AI-powered predictive analytics platform. The portal aims to simplify attendance, leave management, and risk analysis for both employees and HR managers through a unified, modern interface."),

      h1("3. Objectives"),
      bullet("Predict holiday and peak leave seasons to optimize team scheduling and maintain productivity."),
      bullet("Analyze and identify employee flight risks and burnout patterns using Machine Learning."),
      bullet("Provide a secure, isolated admin portal specifically for HR oversight and administration."),
      bullet("Deliver a premium user experience with a responsive, glassmorphism UI and dark mode."),
      bullet("Ensure cross-border synchronization with precise timezone-aware attendance tracking."),

      h1("4. Solution"),
      p("The proposed solution is a modern, high-performance web application that integrates predictive modeling and intelligent dashboards. It offers simple self-service tools for employees to manage their daily HR needs, while providing advanced oversight and data-driven insights to HR administrators. Security is ensured by completely isolating the employee and administrative portals."),

      h1("5. Methodology"),
      p("We followed an Agile-based development methodology, enabling iterative and continuous delivery. The frontend and core application logic were built using Next.js and Tailwind CSS for rapid prototyping and deployment. For the intelligence layer, Python-based Machine Learning models (using XGBoost and Scikit-learn) were developed as a FastAPI microservice, ensuring seamless integration between the modern web frontend and powerful backend analytics."),

      h1("6. Tech Stack"),
      bullet("Frontend & Full-stack Framework: Next.js 16 (App Router), TypeScript"),
      bullet("UI & Styling: Tailwind CSS v4, Framer Motion, Recharts, Glassmorphism design"),
      bullet("Authentication: Clerk (Dual-layer secure auth)"),
      bullet("Database: MongoDB & Mongoose"),
      bullet("Machine Learning API: Python, FastAPI, XGBoost, Scikit-learn"),
      bullet("Storage & Infrastructure: AWS S3, Vercel Deployment"),

      h1("7. Flowchart"),
      p("The general workflow of the system operates as follows:"),
      bullet("Step 1: User Access. A user visits the portal landing page."),
      bullet("Step 2: Authentication. The system identifies the user via Clerk secure login."),
      bullet("Step 3: Role-Based Routing. Based on credentials, the user is routed to either the Employee Dashboard or the Isolated Admin Portal."),
      bullet("Step 4 (Employee): The employee can manage their profile, mark attendance, apply for leaves, and access documents."),
      bullet("Step 5 (Admin/HR): The admin oversees the entire workforce, manages leaves, and accesses the Analytics Dashboard."),
      bullet("Step 6: AI/ML Integration. Behind the scenes, the FastAPI ML service processes attendance and leave data to push predictive insights (e.g., flight risk, burnout) to the Admin Dashboard."),

      h1("8. Conclusion"),
      p("The Smart HR Portal successfully bridges the gap between basic record-keeping and proactive workforce management. By integrating AI-driven predictive insights directly into daily operations, the project delivers a modern, secure, and highly efficient ecosystem. It not only streamlines HR tasks but also empowers managers to make data-driven decisions regarding team well-being and resource allocation.")
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const outputPath = path.join(__dirname, 'Smart_HR_Portal_Project_Report.docx');
  fs.writeFileSync(outputPath, buf);
  console.log("Document successfully created at: " + outputPath);
});

# ChromoXplorer

ChromoXplorer is a research-driven visualization project focused on understanding and communicating the three-dimensional (3D) organization of genomes. It provides an interactive system that helps users explore genome structure across multiple levels of biological organization with an emphasis on spatial context, clarity, and usability.

## Tech Stack

- MERN (MongoDB, Express.js, React, Node.js) for the core web application.
- AWS services for authentication, hosting, and planned dataset storage.

## Project Goals and Vision

- Build a flexible platform for exploring genome organization in a way that mirrors modern biological understanding.
- Emphasize physical shape, spatial relationships, and hierarchical organization over flat or symbolic views.
- Support both education and exploratory research without sacrificing scientific meaning.

## Problem Statement

Traditional genome visualization tools often rely on highly abstract representations (e.g., linear tracks or uniform blocks). While efficient for dense data, they can obscure spatial relationships that are critical for understanding 3D genome organization. ChromoXplorer addresses this gap with spatial visualization and hierarchical navigation that helps users connect structure to function.

## Conceptual Exploration Model

ChromoXplorer supports three primary levels of visualization:

1. Chromosome Territories: a nucleus-level view of how chromosomes occupy distinct 3D regions.
2. A/B Compartments: a zoomed view into a chromosome to show functionally distinct chromatin regions.
3. TADs and Genes: localized 3D structures with gene-level elements and interactions.

## Current State

The project is in a prototype phase. The system demonstrates abstracted visualizations of chromosome territories and A/B compartments with mock data, and early work toward TAD and gene visualizations using sample data provided by the stakeholder team.

## Technical Architecture

ChromoXplorer uses a MERN stack:

- Frontend: React for interactive 3D visualization and user interaction.
- Backend: Express.js for data requests and processing.
- Database: MongoDB for flexible genome-related data storage.
- Authentication: AWS Cognito for user management and secure access.
- Infrastructure: AWS Lightsail for hosting (separate instances for frontend, backend, and database).
- Data Storage: AWS S3 planned for serving datasets.

## Future Direction

Planned growth areas include:

- Integration of additional real-world genomic datasets.
- Enhanced interaction and filtering capabilities.
- Improved visual fidelity and performance.
- Comparative analysis across samples or conditions.

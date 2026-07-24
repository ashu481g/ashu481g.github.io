# AshwiniOS

**Version:** MVP v1.0
**Project Type:** Personal Digital Operating System (Web-based)
**Author:** Kumar Ashwini

---

# Vision

AshwiniOS is a web-based Personal Digital Operating System that serves as the central hub for my digital ecosystem.

Unlike a traditional personal website, AshwiniOS is designed to be a configurable platform where applications, content, settings, and integrations are managed through an Admin Control Panel rather than hardcoded into the website.

The long-term objective is to build a modular system that can continuously evolve without requiring structural changes to the application.

---

# MVP Goal

The objective of Version 1 is to demonstrate the core architecture.

The MVP should prove that:

* Homepage is dynamically generated.
* Tiles are configuration-driven.
* Content is separated from code.
* Future applications can be added without modifying the engine.
* Administration will eventually happen through a dedicated Control Panel.

---

# Project Principles

1. **Single Entry Point**

   * `index.html` always remains in the project root.

2. **Configuration over Hardcoding**

   * Anything that may change should be configurable.

3. **Separation of Concerns**

   * Code
   * Configuration
   * Content
   * Data

4. **Modular Design**

   * Each application is treated as an independent module.

5. **Scalable Architecture**

   * The MVP should support future expansion without major redesign.

---

# Folder Structure

```
ashu481g.github.io/

│── index.html

│── assets/
│    ├── css/
│    ├── js/
│    ├── icons/
│    ├── images/
│    └── fonts/

│── config/
│    ├── app.json
│    ├── navigation.json
│    └── theme.json

│── content/
│    ├── about.md
│    └── contact.json

│── data/
│    ├── homepage/
│    ├── inventory/
│    ├── finance/
│    ├── users/
│    └── admin/

│── modules/
│    ├── home/
│    ├── admin/
│    └── shared/

│── docs/

│── backend/

└── resources/
```

---

# Folder Responsibilities

## assets/

Static resources used by the website.

* CSS
* JavaScript
* Images
* Icons
* Fonts

---

## config/

Application configuration.

Examples:

* Theme
* Navigation
* Application settings

---

## content/

Human-readable content.

Examples:

* About Me
* Contact Information
* Future Blog Posts

---

## data/

Structured data consumed by modules.

Examples:

* Homepage tiles
* Availability
* Inventory records
* Finance records
* User information

---

## modules/

Independent application modules.

Examples:

* Home
* Admin
* Inventory
* Finance
* AI Teacher

Every module should be capable of growing independently.

---

# Coding Standards

* No inline CSS.
* No inline JavaScript.
* One responsibility per JavaScript file.
* Prefer reusable functions.
* Use descriptive variable names.
* Keep functions small and focused.
* Avoid duplicate code.

---

# Application Layers

```
                AshwiniOS

                   │

      ┌────────────┼────────────┐

      │            │            │

    Engine      Configuration   Content/Data
```

---

# MVP Features

* Dynamic Homepage
* Hero Section
* About Section
* Availability Section
* Dynamic Tile Grid
* Contact Section
* Admin Control Panel (MVP)
* Tile Management
* Local Storage Persistence

---

# Future Roadmap

## Phase 2

* Google Authentication
* Calendar Integration
* Availability Engine
* Module Marketplace
* Theme Manager

## Phase 3

* Node.js Backend
* PostgreSQL Database
* User Management
* Content Management
* REST API

## Phase 4

* AI Teacher
* Inventory System
* Finance Dashboard
* Learning Hub
* Analytics

---

# Development Workflow

For every feature:

1. Define Requirement
2. Design Architecture
3. Update Configuration
4. Implement Code
5. Test
6. Commit to Git
7. Deploy

---

# Git Commit Convention

Examples:

```
feat: add tile engine
feat: add admin dashboard
fix: homepage rendering
style: improve layout
docs: update README
refactor: simplify storage layer
```

---

# Long-Term Goal

AshwiniOS is intended to become a configurable personal platform where new applications, modules, and content can be managed through an Admin Control Panel rather than by editing source code.

The project is being designed so that the underlying engine remains stable while functionality grows through configuration and modular expansion.

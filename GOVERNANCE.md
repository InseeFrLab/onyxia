# Governance of Onyxia

## Introduction

Onyxia is not just a project, but a testament to the future of open collaboration in the data realm. Inspired by the prolific "mother of dragons", Onyxia's vision is to give life to myriad data services, while seamlessly integrating other open-source tools. We're not here to chain or limit, but to empower. This is a project that believes in true freedom of data service usage, ensuring users enjoy a rich experience without getting ensnared into vendor-specific boundaries.

## Foundational Principles

1. **Open Collaboration:** Harnessing the combined strengths of diverse open-source tools to foster continuous innovation.
2. **User Empowerment:** Ensuring a user experience that is both enriching and liberating.
3. **Sustainability:** Committing to the long-term growth and vibrancy of the project and its community.
4. **No Vendor Lock-In:** Guaranteeing flexibility and freedom of choice, allowing users to shape their experience without constraints.
5. **Reversibility and Flexibility:** Committing to a design that's not overly attached to a single interface, fostering adaptability and accommodating future enhancements.

## Onyxia's Repository Structure

Onyxia is structured as a multi-repository project to ensure modular development and streamlined deployment processes. This structure allows each component to be developed, tested, and deployed independently, offering both flexibility and scalability to the entire project.

- [Main Repository - Onyxia Software](https://github.com/Inseefrlab/Onyxia)
This is the core repository of Onyxia, where the main software resides. It contains the source code, configurations, and documentation for Onyxia's primary functionalities. Any enhancements, bug fixes, or major features related to the core platform are generally contributed to this repository.

- [Docker Images Repository - Web IDE Stack](https://github.com/Inseefrlab/images-datascience)
Complementing the main software, Onyxia also has a dedicated repository for its stack of Docker images. These images are tailored for providing many Web IDE (Integrated Development Environment) to users. It ensures that users have all the tools and environments they need, right out of the box. The repository contains the Dockerfiles, associated scripts, and other necessary assets to build, test, and publish these images.

- [Helm Charts Repository](https://github.com/inseefrlab/helm-charts-interactive-services)
Helm charts are instrumental in deploying applications in Kubernetes environments. Onyxia has a separate repository dedicated to Helm charts for its Docker images. These charts encapsulate the deployment specifications, dependencies, and configurations, making it a breeze for users or administrators to deploy Onyxia's components in their Kubernetes clusters.

By separating these components into distinct repositories, Onyxia ensures a clean separation of concerns, making it easier for developers to work on specific aspects without affecting others. Additionally, it facilitates version control, dependency management, and continuous integration/continuous deployment (CI/CD) processes, ensuring that Onyxia remains robust and state-of-the-art.

## Core Team

### Roles and Responsibilities

- **Drive Vision:** Uphold and steer Onyxia's overarching mission.
- **Repository Oversight:** Ensure a consistent vision across all repositories.
- **Conflict Resolution:** Mediate disagreements and guide towards consensus.

## Core Team Members

| Name           | Affiliation | GitHub ID  |
| -------------- | ----------- | ---------- |
| Frédéric Comte | Insee       | [@fcomte](https://github.com/fcomte)  |
| Joseph Garrone | Insee     |  [@garonnej](https://github.com/garronej) |
| Olivier Levitt | Insee     |  [@olevitt](https://github.com/olevitt) |
| Romain Lesur | Insee     |  [@rlesur](https://github.com/rlesur) |

## Repository Maintainers

### Roles and Responsibilities

- **Repo-specific Vision:** Direct the path for their designated repository.
- **Review and Merge:** Oversee pull requests, manage issues, and ensure quality.
- **Align with Core Team:** Ensure consistent progress in line with Onyxia's broader goals.

### List of maintainers

As described in the Onyxia's Repository Structure section, there are many repositories.
For each repository, a file named Maintainers.md must be created with the following format:


| Name           | GitHub ID | Affiliation  | Role
| -------------- | ----------- | ---------- | --------- |
| [Name of Maintainer] | @GitHubID | [Affiliation] | Lead Maintainer |
| ...            | ...         | ...                | Co maintainer |

- [Onyxia maintainers](https://github.com/InseeFrLab/onyxia/blob/main/MAINTAINERS.md)
- [Image datascience maintainers](https://github.com/InseeFrLab/images-datascience/blob/main/MAINTAINERS.md)
- [Helm charts maintainers](https://github.com/InseeFrLab/helm-charts-interactive-services/blob/main/MAINTAINERS.md)

## Contributors

### Roles and Responsibilities

- **Code Contributions:** Offer fixes, new features, and other valuable additions.
- **Issue Reporting:** Highlight bugs and propose enhancements.
- **Community Participation:** Engage in discussions, share ideas, and uphold Onyxia's core values.

## Decision Making

- **Consensus:** Prioritize decisions through collaborative discussion.
- **Voting within Repositories:** If consensus isn't reached, Maintainers can instigate a vote.
- **Veto Rights:** The Core Team possesses veto rights for critical project decisions.

## Communication

- **Public Interaction:** GitHub remains our primary platform for repository-specific conversations.
- **Inter-repo Coordination:** Regular virtual meetings ensure synchronization and alignment.
- **Real-time Engagement:** [Slack channels](https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg) for immediate communication and collaboration.

## Team Expansion

- **Promoting Maintainers:** Active contributors can be nominated to assume the role of Maintainers.
- **Core Team Induction:** Standout contributors may be invited to the Core Team, amplifying Onyxia's vision.

## Code of Conduct

Each Onyxia repository adheres to a unified Code of Conduct, ensuring a respectful and inclusive community for all.

## Revising Governance

The landscape of open-source and data services is ever-evolving. Governance adaptations may be proposed by Core Team members to remain current and effective.

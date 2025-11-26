/**
 * Project Service
 * Handles all project-related GraphQL operations via AppSync
 */

import serverService from "./server";

export interface ProjectProgress {
  overall: number;
  assessment: number;
  design: number;
  planning: number;
  implementation: number;
  currentPhase: string;
  estimatedCompletion?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "CREATED" | "IN_PROGRESS" | "ASSESSMENT_COMPLETE" | "DESIGN_COMPLETE" | "PLANNING_COMPLETE" | "IMPLEMENTATION_READY" | "COMPLETED" | "ERROR";
  createdAt: string;
  updatedAt: string;
  owner?: string;
  progress?: ProjectProgress;
  // Legacy field for backward compatibility
  lastModified?: string;
  userId?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  userId?: string;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: "CREATED" | "IN_PROGRESS" | "ASSESSMENT_COMPLETE" | "DESIGN_COMPLETE" | "PLANNING_COMPLETE" | "IMPLEMENTATION_READY" | "COMPLETED" | "ERROR";
}

// GraphQL Queries
const LIST_PROJECTS = `
  query ListProjects {
    listProjects {
      items {
        id
        name
        description
        status
        createdAt
        updatedAt
        owner
        progress {
          overall
          assessment
          design
          planning
          implementation
          currentPhase
          estimatedCompletion
        }
      }
    }
  }
`;

const GET_PROJECT = `
  query GetProject($id: ID!) {
    getProject(id: $id) {
      id
      name
      description
      status
      createdAt
      updatedAt
      owner
      progress {
        overall
        assessment
        design
        planning
        implementation
        currentPhase
        estimatedCompletion
      }
    }
  }
`;

// GraphQL Mutations
const CREATE_PROJECT = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      status
      createdAt
      updatedAt
      owner
      progress {
        overall
        assessment
        design
        planning
        implementation
        currentPhase
        estimatedCompletion
      }
    }
  }
`;

const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      status
      createdAt
      updatedAt
      owner
      progress {
        overall
        assessment
        design
        planning
        implementation
        currentPhase
        estimatedCompletion
      }
    }
  }
`;

const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      id
    }
  }
`;

/**
 * Project Service Class
 */
class ProjectService {
  /**
   * List all projects for the current user
   */
  async listProjects(): Promise<Project[]> {
    try {
      const response = await serverService.query<{
        listProjects: { items: Project[] };
      }>(LIST_PROJECTS);

      // Map backend fields to frontend interface with backward compatibility
      const projects = response.listProjects.items.map((project) => ({
        ...project,
        userId: project.owner || project.userId,
        lastModified: project.updatedAt, // For backward compatibility
      }));

      return projects;
    } catch (error) {
      console.error("Failed to list projects:", error);
      throw new Error("Failed to load projects. Please try again.");
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    try {
      const response = await serverService.query<{ getProject: Project }>(
        GET_PROJECT,
        { id }
      );

      return {
        ...response.getProject,
        userId: response.getProject.owner || response.getProject.userId,
        lastModified: response.getProject.updatedAt, // For backward compatibility
      };
    } catch (error) {
      console.error("Failed to get project:", error);
      throw new Error("Failed to load project details. Please try again.");
    }
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      // Note: owner/userId is set automatically by the backend based on authenticated user
      // Remove userId from input as backend doesn't accept it
      const { userId, ...projectInput } = input;

      const response = await serverService.mutate<{ createProject: Project }>(
        CREATE_PROJECT,
        { input: projectInput }
      );

      return {
        ...response.createProject,
        userId: response.createProject.owner || response.createProject.userId,
        lastModified: response.createProject.updatedAt, // For backward compatibility
      };
    } catch (error) {
      console.error("Failed to create project:", error);
      throw new Error("Failed to create project. Please try again.");
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(input: UpdateProjectInput): Promise<Project> {
    try {
      const { id, ...updateInput } = input;

      const response = await serverService.mutate<{ updateProject: Project }>(
        UPDATE_PROJECT,
        { id, input: updateInput }
      );

      return {
        ...response.updateProject,
        userId: response.updateProject.owner || response.updateProject.userId,
        lastModified: response.updateProject.updatedAt, // For backward compatibility
      };
    } catch (error) {
      console.error("Failed to update project:", error);
      throw new Error("Failed to update project. Please try again.");
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await serverService.mutate<{ deleteProject: { id: string } }>(
        DELETE_PROJECT,
        { id }
      );
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw new Error("Failed to delete project. Please try again.");
    }
  }

  /**
   * Mark a project as completed
   */
  async completeProject(id: string): Promise<Project> {
    return this.updateProject({
      id,
      status: "COMPLETED",
    });
  }

  /**
   * Mark a project as in-progress
   */
  async reopenProject(id: string): Promise<Project> {
    return this.updateProject({
      id,
      status: "IN_PROGRESS",
    });
  }

  /**
   * Get assessment progress for a project
   */
  async getAssessmentProgress(sessionId: string) {
    const query = `
      query GetAssessmentProgress($sessionId: String!) {
        getAssessmentProgress(sessionId: $sessionId) {
          dimension
          completionPercentage
          isComplete
        }
      }
    `;
    const response = await serverService.query<{
      getAssessmentProgress: Array<{
        dimension: string;
        completionPercentage: number;
        isComplete: boolean;
      }>;
    }>(query, { sessionId });
    return response.getAssessmentProgress;
  }

  /**
   * Subscribe to project progress updates
   */
  subscribeToProjectProgress(projectId: string, callback: () => void) {
    const subscription = `
      subscription OnProjectProgress($projectId: ID!) {
        onProjectProgress(projectId: $projectId) {
          assessment
        }
      }
    `;
    return serverService.subscribe(subscription, { projectId }, callback);
  }

  /**
   * Subscribe to assessment completion events
   */
  subscribeToAssessmentCompletion(
    projectId: string,
    callback: (data: { allDimensionsComplete: boolean }) => void
  ) {
    const subscription = `
      subscription OnAssessmentCompleted($projectId: ID!) {
        onAssessmentCompleted(projectId: $projectId) {
          projectId
          allDimensionsComplete
          timestamp
        }
      }
    `;
    return serverService.subscribe(subscription, { projectId }, (data: any) => {
      if (data?.onAssessmentCompleted) {
        callback(data.onAssessmentCompleted);
      }
    });
  }

  /**
   * Subscribe to design progress events
   */
  subscribeToDesignProgress(
    projectId: string,
    callback: (data: { sectionId: string; completionPercentage: number }) => void
  ) {
    const subscription = `
      subscription OnDesignProgress($projectId: ID!) {
        onDesignProgress(projectId: $projectId) {
          sectionId
          completionPercentage
        }
      }
    `;
    return serverService.subscribe(subscription, { projectId }, (data: any) => {
      if (data?.onDesignProgress) {
        callback(data.onDesignProgress);
      }
    });
  }

  /**
   * Check if design is already complete for a project
   */
  isDesignComplete(project: Project): boolean {
    return project.status === 'DESIGN_COMPLETE' || project.status === 'COMPLETED';
  }

  /**
   * Generate high-level design for a project
   * Returns true if generation was triggered, false if already complete
   */
  async generateDesign(projectId: string): Promise<boolean> {
    const project = await this.getProject(projectId);
    
    if (this.isDesignComplete(project)) {
      return false;
    }

    const mutation = `
      mutation SendMessageToAgent($projectId: ID!, $agentId: String!, $message: String!) {
        sendMessageToAgent(projectId: $projectId, agentId: $agentId, message: $message) {
          id
        }
      }
    `;

    await serverService.mutate(mutation, {
      projectId,
      agentId: 'agent2',
      message: 'Start HLD generation workflow: Initialize the HLD structure, then systematically generate all 30 sections one by one. Begin now.',
    });

    return true;
  }
}

// Export singleton instance
export const projectService = new ProjectService();

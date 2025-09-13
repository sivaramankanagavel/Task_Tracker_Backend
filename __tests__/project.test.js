const request = require('supertest');
const app = require('../app');
const projectService = require('../services/projectService');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

// Mock the entire projectService module
jest.mock('../services/projectService', () => ({
  getUserProjects: jest.fn(),
  getProjectById: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  addMembers: jest.fn(),
  removeMember: jest.fn(),
}));

describe('Project API', () => {
  // Define mock data
  const mockUserId = '60d0fe4f3a76a3b4b8b8b8b8';
  const mockProjectId = '60d0fe4f3a76a3b4b8b8b8c0';
  const mockMemberId = '60d0fe4f3a76a3b4b8b8b8b9';

  const mockProject = {
    _id: mockProjectId,
    name: 'Test Project',
    description: 'A project for testing',
    ownerId: mockUserId,
    members: [],
    createdAt: new Date().toISOString(),
  };

  const mockProjects = [
    mockProject,
    {
      _id: '60d0fe4f3a76a3b4b8b8b8c1',
      name: 'Another Project',
      description: 'Another one for testing',
      ownerId: mockUserId,
      members: [mockMemberId],
      createdAt: new Date().toISOString(),
    },
  ];

  const mockToken = 'valid_auth_token';

  beforeEach(() => {
    jest.clearAllMocks();
    projectService.getUserProjects.mockResolvedValue(mockProjects);
    projectService.getProjectById.mockResolvedValue(mockProject);
    projectService.createProject.mockResolvedValue(mockProject);
    projectService.updateProject.mockResolvedValue({ ...mockProject, name: 'Updated Project' });
    projectService.deleteProject.mockResolvedValue(null);
    projectService.addMembers.mockResolvedValue({ ...mockProject, members: [...mockProject.members, mockMemberId] });
    projectService.removeMember.mockResolvedValue({ ...mockProject, members: [] });
  });

  describe('GET /api/v1/projects', () => {
    it('should get all projects for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockProjects);
      expect(projectService.getUserProjects).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 500 if fetching projects fails', async () => {
      projectService.getUserProjects.mockRejectedValue(new AppError('Failed to fetch projects', 500));

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Failed to fetch projects');
      expect(projectService.getUserProjects).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get a project by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockProject);
      expect(projectService.getProjectById).toHaveBeenCalledWith(mockProjectId);
    });

    it('should return 404 if project not found', async () => {
      // Mock the service to throw a 404 AppError
      projectService.getProjectById.mockRejectedValue(new AppError('Project not found', 404));

      const res = await request(app)
        .get(`/api/v1/projects/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Project not found');
      expect(projectService.getProjectById).toHaveBeenCalledWith('nonexistentid');
    });
  });

  describe('POST /api/v1/projects', () => {
    const newProjectData = {
      name: 'New Project',
      description: 'A new test project',
    };
    const createdProject = {
      _id: '60d0fe4f3a76a3b4b8b8b8d0',
      ...newProjectData,
      ownerId: mockUserId,
      members: [],
      createdAt: new Date().toISOString(),
    };

    it('should create a new project', async () => {
      projectService.createProject.mockResolvedValue(createdProject);

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newProjectData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdProject);
      expect(projectService.createProject).toHaveBeenCalledWith({ ...newProjectData, ownerId: mockUserId });
    });

    it('should return 400 if project creation fails', async () => {
      // Mock the service to throw a 400 AppError
      projectService.createProject.mockRejectedValue(new AppError('Failed to create project', 400));

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Failed to create project');
      expect(projectService.createProject).toHaveBeenCalledWith({ ownerId: mockUserId });
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    const updateData = { description: 'Updated description' };
    const updatedProject = { ...mockProject, ...updateData };

    it('should update an existing project', async () => {
      projectService.updateProject.mockResolvedValue(updatedProject);

      const res = await request(app)
        .put(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updatedProject);
      expect(projectService.updateProject).toHaveBeenCalledWith(mockProjectId, updateData);
    });

    it('should return 404 if project to update not found', async () => {
      // Mock the service to throw a 404 AppError
      projectService.updateProject.mockRejectedValue(new AppError('Project not found', 404));

      const res = await request(app)
        .put(`/api/v1/projects/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Project not found');
      expect(projectService.updateProject).toHaveBeenCalledWith('nonexistentid', updateData);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project', async () => {
      projectService.deleteProject.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});
      expect(projectService.deleteProject).toHaveBeenCalledWith(mockProjectId);
    });

    it('should return 404 if project to delete not found', async () => {
      // Mock the service to throw a 404 AppError
      projectService.deleteProject.mockRejectedValue(new AppError('Project not found', 404));

      const res = await request(app)
        .delete(`/api/v1/projects/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Project not found');
      expect(projectService.deleteProject).toHaveBeenCalledWith('nonexistentid');
    });
  });

  describe('POST /api/v1/projects/:id/members', () => {
    const userIdsToAdd = ['60d0fe4f3a76a3b4b8b8b8e0', '60d0fe4f3a76a3b4b8b8b8e1'];
    const projectWithNewMembers = {
      ...mockProject,
      members: [...mockProject.members, ...userIdsToAdd],
    };

    it('should add members to a project', async () => {
      projectService.addMembers.mockResolvedValue(projectWithNewMembers);

      const res = await request(app)
        .post(`/api/v1/projects/${mockProjectId}/members`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ userIds: userIdsToAdd });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(projectWithNewMembers);
      expect(projectService.addMembers).toHaveBeenCalledWith(mockProjectId, userIdsToAdd);
    });

    it('should return 404 if project not found when adding members', async () => {
      // Mock the service to throw a 404 AppError
      projectService.addMembers.mockRejectedValue(new AppError('Project not found', 404));

      const res = await request(app)
        .post(`/api/v1/projects/nonexistentid/members`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ userIds: userIdsToAdd });

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Project not found');
      expect(projectService.addMembers).toHaveBeenCalledWith('nonexistentid', userIdsToAdd);
    });
  });

  describe('DELETE /api/v1/projects/:id/members/:userId', () => {
    const userIdToRemove = mockMemberId;
    const projectAfterRemoval = { ...mockProject, members: [] };

    it('should remove a member from a project', async () => {
      projectService.removeMember.mockResolvedValue(projectAfterRemoval);

      const res = await request(app)
        .delete(`/api/v1/projects/${mockProjectId}/members/${userIdToRemove}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(projectAfterRemoval);
      expect(projectService.removeMember).toHaveBeenCalledWith(mockProjectId, userIdToRemove);
    });

    it('should return 404 if project not found when removing member', async () => {
      // Mock the service to throw a 404 AppError
      projectService.removeMember.mockRejectedValue(new AppError('Project not found', 404));

      const res = await request(app)
        .delete(`/api/v1/projects/nonexistentid/members/${userIdToRemove}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Project not found');
      expect(projectService.removeMember).toHaveBeenCalledWith('nonexistentid', userIdToRemove);
    });
  });
});

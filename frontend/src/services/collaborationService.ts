import api from "@/services/api";

export interface Share {
  id: string;
  entityType: "calendar" | "event" | "task";
  entityId: string | null;
  email: string | null;
  userId: string | null;
  teamId: string | null;
  permission: "view" | "edit";
  status: "pending" | "accepted";
  token: string;
  createdAt: string;
  entityLabel?: string;
  entityTitle?: string | null;
  teamName?: string | null;
  displayName?: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string | null;
  name: string | null;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "active";
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

export interface CollabComment {
  id: string;
  entityType: string;
  entityId: string;
  authorName: string | null;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

export const collaborationService = {
  // --- Compartilhamentos ---
  createShare: async (payload: {
    entityType: "calendar" | "event" | "task";
    entityId?: string;
    email?: string;
    teamId?: string;
    permission?: "view" | "edit";
  }) => {
    const { data } = await api.post("/collaboration/shares", payload);
    return data.data as Share;
  },
  myShares: async () => {
    const { data } = await api.get("/collaboration/shares/mine");
    return data.data as Share[];
  },
  receivedShares: async () => {
    const { data } = await api.get("/collaboration/shares/received");
    return data.data as Share[];
  },
  acceptShare: async (token: string) => {
    const { data } = await api.post(`/collaboration/shares/${token}/accept`);
    return data.data as Share;
  },
  revokeShare: async (id: string) => {
    await api.delete(`/collaboration/shares/${id}`);
  },

  // --- Equipes ---
  createTeam: async (payload: { name: string; description?: string }) => {
    const { data } = await api.post("/collaboration/teams", payload);
    return data.data as Team;
  },
  listTeams: async () => {
    const { data } = await api.get("/collaboration/teams");
    return data.data as Team[];
  },
  inviteMember: async (teamId: string, payload: { email: string; role?: "admin" | "member" }) => {
    const { data } = await api.post(`/collaboration/teams/${teamId}/members`, payload);
    return data.data as TeamMember;
  },
  updateMemberRole: async (teamId: string, memberId: string, role: "admin" | "member") => {
    await api.patch(`/collaboration/teams/${teamId}/members/${memberId}`, { role });
  },
  removeMember: async (teamId: string, memberId: string) => {
    await api.delete(`/collaboration/teams/${teamId}/members/${memberId}`);
  },

  // --- Comentários / chat ---
  listComments: async (entityType: string, entityId: string) => {
    const { data } = await api.get("/collaboration/comments", { params: { entityType, entityId } });
    return data.data as CollabComment[];
  },
  createComment: async (entityType: string, entityId: string, content: string) => {
    const { data } = await api.post("/collaboration/comments", { entityType, entityId, content });
    return data.data as CollabComment;
  },
  removeComment: async (id: string) => {
    await api.delete(`/collaboration/comments/${id}`);
  },

  // --- Histórico ---
  history: async (entity?: string, entityId?: string) => {
    const { data } = await api.get("/collaboration/history", { params: { entity, entityId } });
    return data.data as HistoryEntry[];
  },
};

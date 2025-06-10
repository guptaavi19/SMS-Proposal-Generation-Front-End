export type Customer = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportType = {
  apiName: string;
  displayName: string;
};

export type Project = {
  id: string;
  customerId: string;
  reportType: {
    apiName: string;
    displayName: string;
  };
  name: string;
  number: string;
  location: string;
  originator: string;
  reviewer: string;
  approver: string;
  content: ProjectContent[];
  createdAt: string;
  updatedAt: string;
  sections: Section[];
};

export type ProjectContent = {
  apiName: string;
  displayName: string;
  content: string;
};

export type Section = {
  id: string;
  projectId: string;
  apiName: string;
  displayName: string;
  response: string;
  createdAt: string;
  updatedAt: string;
};

export enum Role {
  GRADUATE_ENGINEER = "graduate_engineer",
  MECHANICAL_ENGINEER = "mechanical_engineer",
  LEAD_ENGINEER = "lead_engineer",
}

export type GetSectionsResponse = {
  data: {
    sections: Section[];
  };
};

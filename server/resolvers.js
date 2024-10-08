import {
  getJobs,
  getJob,
  getJobsByCompany,
  createJob,
  deleteJob,
  updateJob,
} from "./db/jobs.js";
import { getCompany } from "./db/companies.js";
import { GraphQLError } from "graphql";

export const resolvers = {
  Query: {
    jobs: () => getJobs(),
    job: async (_root, { id }) => {
      const job = await getJob(id);
      if (!job) {
        throw notFoundError("No Job found with id" + id);
      }
      return job;
    },
    company: (_root, { id }) => getCompany(id),
  },

  Company: {
    jobs: (company) => getJobsByCompany(company.id),
  },

  // convert db field name to match schema, cutting time unit of, keepping only date.
  Job: {
    date: (job) => toIsoDate(job.createdAt),
    company: (job) => getCompany(job.companyId),
  },
  Mutation: {
    createJob: (_root, { input: { title, description } }, { user }) => {
      if (!user) {
        throw unauthorizedError("Missing authentication");
      }
      return createJob({ companyId: user.companyId, title, description });
    },
    deleteJob: async (_root, { id }, {user}) => {
        if (!user) {
            throw unauthorizedError("Missing authentication");
        }
        // user can only delete the job that belongs his company
        const job = await deleteJob(id, user.companyId);
        if (!job) {
            throw notFoundError("No Job found with id" + id);
        }
        return job;
    },
    updateJob: async (_root, { input: { id, title, description } }, { user }) => {
        if (!user) {
            throw unauthorizedError("Missing authentication");
        }
        const job = await updateJob({id, title, description }, user.companyId);
        if (!job) {
            throw notFoundError("No Job found with id" + id);
        }
        return job;
    },
  },
};

// use helper function to make resolvers itself more readable
function toIsoDate(value) {
  return value.slice(0, "yyyy-mm-dd".length);
}

function notFoundError(message) {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function unauthorizedError(message) {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHORIZED" },
  });
}

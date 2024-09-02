import {
  ApolloClient,
  ApolloLink,
  concat,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { getAccessToken } from "../auth";

// 为了使用户对服务器的请求都可以携带token，我们会在apollo client 里进行调整，而不会在
// 具体的fuction中进行操作

const httpLink = createHttpLink({ uri: "http://localhost:9000/graphql" });
const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    operation.setContext({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  return forward(operation);
});
const apolloClient = new ApolloClient({
  link: concat(authLink, httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "cache-first",
    },
  },
});

export async function getJobs() {
  const query = gql`
    query {
      jobs {
        id
        date
        title
        company {
          name
        }
      }
    }
  `;
  const { data } = await apolloClient.query({
    query,
    fetchPolicy: "network-only",
  });
  return data.jobs;
}
const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    description
    date
    company {
      id
      name
    }
  }
`;

const jobByIdQuery = gql`
  query JobById($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;
export async function getJob(id) {
  const { data } = await apolloClient.query({
    query: jobByIdQuery,
    variables: { id },
  });
  return data.job;
}

export async function getCompany(id) {
  const query = gql`
    query Company($id: ID!) {
      company(id: $id) {
        id
        name
        description
        jobs {
          id
          date
          title
        }
      }
    }
  `;
  const { data } = await apolloClient.query({ query, variables: { id } });
  return data.company;
}

export async function createJob({ title, description }) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput!) {
      job: createJob(input: $input) {
        ...JobDetail
      }
    }
    ${jobDetailFragment}
  `;
  //FIXME 忘记加花括号解构赋值，导致出了bug
  const { data } = await apolloClient.mutate({
    mutation,
    variables: { input: { title, description } },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: jobByIdQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });
  return data.job;
}

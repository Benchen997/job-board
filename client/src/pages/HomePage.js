import { useEffect, useState } from "react";
import JobList from "../components/JobList";
import { getJobs } from "../lib/graphql/queries";

function HomePage() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    //getJobs().then((jobs) => setJobs(jobs));
    // 简化写法
    getJobs().then(setJobs);
  }, []);

  console.log("[HomePage] jobs:", jobs);

  return (
    <div>
      <h1 className="title">Job Board</h1>
      <JobList jobs={jobs} />
    </div>
  );
}

export default HomePage;

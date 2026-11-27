import { Projects } from "~/app/_projects";

type PageProps = { params: { projectId: string; repositoryId: string } };

const Page = ({ params }: PageProps) => (
  <Projects
    key={params.repositoryId}
    view="projects"
    projectId={params.projectId}
    repositoryId={params.repositoryId}
  />
);

export default Page;

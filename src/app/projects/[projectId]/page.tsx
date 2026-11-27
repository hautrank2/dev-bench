import { Projects } from "~/app/_projects";

const Page = ({ params }: { params: { projectId: string } }) => (
  <Projects view="projects" projectId={params.projectId} />
);

export default Page;

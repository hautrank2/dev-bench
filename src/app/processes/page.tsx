import { Navigate } from "@tanstack/react-router";

// Keep previously saved URLs usable after removing the duplicate page.
const Page = () => <Navigate to="/projects" replace />;

export default Page;

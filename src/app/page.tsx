import { WorkbenchApp } from "@/components/workbench/WorkbenchApp";

export default function HomePage() {
  return <WorkbenchApp defaultWorkspacePath={process.env.DEFAULT_WORKSPACE_PATH} />;
}

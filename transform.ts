import { join, resolve } from "node:path";
import { Store } from "./src/Store";
import { fileToYaml, yamlToJson } from "./src/utils";

checkViolations();

function checkViolations(): void {
  const packagePath = resolve(__dirname, "project-scan");
  Store.getInstance().addMessage(`Checking for violations`);
  const evaluationFilePath = join(packagePath, "evaluation-result.yml");
  const evaluationYaml = fileToYaml(evaluationFilePath);
  const evaluationJson = yamlToJson(evaluationYaml ?? "");
  const violations = evaluationJson.violations;
  if (violations.length > 0) {
    Store.getInstance().addMessage(`Violations found`);
  } else {
    Store.getInstance().addMessage(`No violations found`);
  }
  Store.getInstance().addMessage(`done`);
}

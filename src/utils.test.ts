import { expect, test } from "bun:test";
import { fileToYaml, yamlToJson } from "./utils";
import { resolve } from "node:path";

const testDataPath = resolve(__dirname, "test-data");
const evaluationResultPath = resolve(testDataPath, "evaluation-result.yml");

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});

test("Should load the evaluator result yaml file", () => {
  const result = fileToYaml(evaluationResultPath);
  expect(result).not.toBeNull();
});

test("Should fail to load the evaluator result yaml file", () => {
  const result = fileToYaml(resolve(testDataPath, "non-existent-file.yml"));
  expect(result).toBeUndefined();
});

test("Should convert yaml to json", () => {
  const yamlString = `
  YAML:
  - A human-readable data serialization language
  - https://en.wikipedia.org/wiki/YAML
  `;
  const json = yamlToJson(yamlString);
  expect(json).not.toBeNull();
});

test("Should fail to convert yaml to json", () => {
  const yamlString = ``;
  const json = yamlToJson(yamlString);
  expect(json).toBeNull();
});

test("Should check for violations", () => {
  const yamlString = `
  evaluator:
    start_time: "2025-01-03T15:51:35.490006028Z"
    end_time: "2025-01-03T15:51:40.539981140Z"
    violations:
    - rule: "UNHANDLED_LICENSE"
      pkg: "NPM::ckeditor4:4.22.0"
      license: "LicenseRef-scancode-commercial-license"
      license_source: "DETECTED"
      severity: "ERROR"
      message: "The license LicenseRef-scancode-commercial-license is currently not\
        \ covered by policy rules. The license was detected in package NPM::ckeditor4:4.22.0."
      how_to_fix: "A text written in MarkDown to help users resolve policy violations\n\
        which may link to additional resources."
    - rule: "UNHANDLED_LICENSE"
      pkg: "NPM::ckeditor4:4.22.0"
      license: "NOASSERTION"
      license_source: "DETECTED"
      severity: "ERROR"
      message: "The license NOASSERTION is currently not covered by policy rules. The\
        \ license was detected in package NPM::ckeditor4:4.22.0."
      how_to_fix: "A text written in MarkDown to help users resolve policy violations\n\
        which may link to additional resources."
  `;
  const json = yamlToJson(yamlString);
  expect(json.evaluator.violations).not.toBeNull();
  expect(json.evaluator.violations).not.toBeUndefined();
});



#!/usr/bin/env node

import fs from "fs-extra";
import path from "node:path";
import {
  cancel,
  isCancel,
  note,
  outro,
  select,
  text,
  confirm,
  intro,
  spinner as Spinner,
} from "@clack/prompts";
import { fileURLToPath } from "node:url";
import { lightGreen, lightYellow } from "kolorist";
import isGitUrl from "is-git-url";
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mainSymbols } from "figures";

import { readPackageJSON, writePackageJSON, type PackageJson } from "pkg-types";

import { version } from "../package.json";
import { trimNewline } from "./utils";

type Manager = "npm" | "yarn" | "pnpm" | "cnpm";

const figuresLogs = {
  tick: (message: string) => mainSymbols.tick + " " + message,
  cross: (message: string) => mainSymbols.cross + " " + message,
  info: (message: string) => mainSymbols.info + " " + message,
  warning: (message: string) => mainSymbols.warning + " " + message,
};

const spinner = Spinner();

const TEMPLATE_PATH = fileURLToPath(new URL("../template", import.meta.url));

const TEMPLATES = fs
  .readdirSync(TEMPLATE_PATH)
  .filter((file) => fs.statSync(`${TEMPLATE_PATH}/${file}`).isDirectory())
  .sort((a, b) => a.localeCompare(b));

const exit = (str?: string) => {
  cancel(str ?? "Operation cancelled.");
  process.exit(0);
};

function checkCancel(value: unknown) {
  if (isCancel(value)) {
    exit();
  }
}

export async function init() {
  console.log("");
  intro(
    lightGreen(mainSymbols.musicNote + " Create Anys, Version: " + version)
  );

  let name = (await text({
    message: "Project name",
    placeholder: "my-project",
    validate(value) {
      if (value.length === 0) {
        return "Project name is required";
      }
      if (!/^[a-z0-9-]+$/.test(value)) {
        return "Project name can only contain letters, numbers, and hyphens";
      }
    },
  })) as string;

  checkCancel(name);

  const projectPath = path.join(process.cwd(), name);

  let overwrite = false;
  if (fs.existsSync(projectPath)) {
    overwrite = (await select({
      message: `The destination directory is not empty. Are you sure you want to overwrite it?`,
      options: [
        {
          label: "Yes",
          value: true,
        },
        {
          label: "No",
          value: false,
        },
      ],
    })) as boolean;

    if (!overwrite) {
      exit();
    }

    checkCancel(overwrite);
  }

  const template = (await select({
    message: "Select template",
    options: [
      ...TEMPLATES.map((dir) => ({
        label: dir,
        value: dir,
        hint: JSON.parse(
          fs.readFileSync(
            path.join(TEMPLATE_PATH, dir, "package.json"),
            "utf-8"
          )
        ).description,
      })),
      {
        label: "custom",
        value: "custom",
        hint: "Input the git repository",
      },
    ],
  })) as string;

  checkCancel(template);

  let customGit = "";
  if (template === "custom") {
    customGit = (await text({
      message: "Input the git repository",
      placeholder: "",
      validate(value) {
        if (!isGitUrl(value)) {
          return "Invalid git repository";
        }
      },
    })) as string;

    checkCancel(customGit);
  }

  const pkgManager = (await select({
    message: "Select package manager",
    options: [
      { label: "pnpm", value: "pnpm" },
      { label: "cnpm", value: "cnpm" },
      { label: "npm", value: "npm" },
      { label: "yarn", value: "yarn" },
    ],
  })) as Manager;

  checkCancel(pkgManager);

  const initGit = (await confirm({
    message: "Init git?",
    initialValue: true,
  })) as boolean;

  checkCancel(initGit);

  async function createProjectDir() {
    spinner.start("Create project dir");

    if (overwrite) {
      await fs.remove(projectPath);
    }
    await fs.mkdir(projectPath);

    spinner.stop(lightGreen(figuresLogs.tick("Project dir created")));
  }

  await createProjectDir();

  async function cloneCustomTemplate() {
    spinner.start("Cloning template");
    try {
      const logs = execSync(`git clone ${customGit} ${name}`, {
        stdio: "pipe",
      }).toString();
      await fs.remove(path.join(projectPath, ".git"));

      spinner.stop(figuresLogs.tick(trimNewline(logs)));
    } catch (error) {
      await fs.remove(projectPath);
      exit();
    }
  }

  async function copyTemplateFiles(templatePath: string, projectPath: string) {
    spinner.start("Copying template files");
    await fs.copy(templatePath, projectPath);
    spinner.stop(lightGreen(figuresLogs.tick("Template files copied")));
  }

  if (template === "custom") {
    await cloneCustomTemplate();
  } else {
    await copyTemplateFiles(path.join(TEMPLATE_PATH, template), projectPath);
  }

  async function updatePackageJson() {
    spinner.start("Updating package.json");
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson: PackageJson = JSON.parse(
      await fs.readFile(packageJsonPath, "utf-8")
    );
    packageJson.name = name;
    packageJson.scripts = {
      ...packageJson.scripts,
      preinstall: `npx only-allow ${pkgManager}`,
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    spinner.stop(lightGreen(figuresLogs.tick("Package.json updated")));
  }
  await updatePackageJson();

  if (initGit) {
    spinner.start("Initializing git");
    try {
      const logs = execSync("git init", {
        stdio: "pipe",
        cwd: projectPath,
      }).toString();

      spinner.stop(lightGreen(figuresLogs.tick(trimNewline(logs))));
    } catch (error) {
      exit("Git init failed.");
    }
  }

  note(
    [
      `\u{1F449} ${lightYellow(`cd ${name}`)}`,
      `\u{1F449} ${lightYellow(
        pkgManager === "yarn" ? "yarn" : `${pkgManager} install`
      )}`,
    ].join("\n"),
    lightYellow("Next steps")
  );

  outro("Done.");
}

init().catch((err) => {
  exit(err);
});

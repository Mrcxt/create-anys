#!/usr/bin/env node

import fs from "node:fs";
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
  spinner,
} from "@clack/prompts";
import { logger } from "rslog";
import { fileURLToPath } from "node:url";
import { lightBlue, lightGreen, lightRed, lightYellow } from "kolorist";
import isGitUrl from "is-git-url";
import { execSync } from "node:child_process";
import minimist from "minimist";
import Ora from "ora";
import type { PackageJson } from "types-package-json";
import { version } from "../package.json";

// const argv = minimist(process.argv.slice(2));

// console.log("argv:", argv);

const TEMPLATE_PATH = fileURLToPath(new URL("../template", import.meta.url));

const TEMPLATES = fs
  .readdirSync(TEMPLATE_PATH)
  .filter((file) => fs.statSync(`${TEMPLATE_PATH}/${file}`).isDirectory());

function checkCancel(value: unknown) {
  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
}

function snakeCase(str: string, connector = "-") {
  // 将驼峰字符串转换为横线链接
  const result = str.replace(
    /[A-Z]/g,
    (match) => `${connector}${match.toLowerCase()}`
  );

  // 过滤掉非字母、数字、连接符的字符
  const filteredResult = result.replace(
    new RegExp(`[^a-zA-Z0-9${connector}]`, "g"),
    ""
  );

  // 去除开头和结尾的连接符
  return filteredResult.replace(
    new RegExp(`^${connector}|${connector}$`, "g"),
    ""
  );
}

export async function init() {
  // const { start, stop } = spinner();
  const spinner = Ora("Initializing...");
  console.log("");
  logger.greet("◆  Create Anys, Version: " + version);
  let name = (await text({
    message: "Project name",
    placeholder: "my-project",
    validate(value) {
      if (value.length === 0) {
        return "Project name is required";
      }
      // 检验项目名是否合法
      if (!/^[a-z0-9-]+$/.test(value)) {
        return "Project name can only contain letters, numbers, and hyphens";
      }
    },
  })) as string;

  checkCancel(name);

  const projectPath = path.join(process.cwd(), name);

  if (fs.existsSync(projectPath)) {
    const overwrite = (await select({
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

    checkCancel(overwrite);
  }

  const template = (await select({
    message: "Select template",
    options: [
      {
        label: "custom",
        value: "custom",
        hint: "Input the git repository",
      },
      ...TEMPLATES.map((dir) => ({
        label: dir,
        value: dir,
      })),
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

  // const isInitCommitlint = (await confirm({
  //   message: "Init commitlint?",
  //   initialValue: true,
  // })) as boolean;

  // checkCancel(isInitCommitlint);

  const pkgManager = (await select({
    message: "Select package manager",
    options: [
      {
        label: "pnpm",
        value: "pnpm",
      },
      {
        label: "cnpm",
        value: "cnpm",
      },
      {
        label: "npm",
        value: "npm",
      },
      {
        label: "yarn",
        value: "yarn",
      },
    ],
  })) as string;

  checkCancel(pkgManager);

  //
  function createProjectDir() {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true });
    }
    fs.mkdirSync(projectPath);
  }

  createProjectDir();

  //
  function copyTemplateFiles(templatePath: string, projectPath: string) {
    const files = fs.readdirSync(templatePath);
    files.forEach((file) => {
      const currentPath = path.join(templatePath, file);
      const targetPath = path.join(projectPath, file);
      if (fs.statSync(currentPath).isDirectory()) {
        fs.mkdirSync(targetPath);
        copyTemplateFiles(currentPath, targetPath);
      } else {
        fs.copyFileSync(currentPath, targetPath);
      }
    });
  }

  //
  function cloneCustomTemplate() {
    try {
      execSync(`git clone ${customGit} ${name}`, { stdio: "inherit" });
    } catch (error) {
      fs.rmSync(projectPath, { recursive: true });
      logger.error(lightRed("Clone failed."));
      process.exit(1);
    }
    fs.rmSync(path.join(projectPath, ".git"), { recursive: true });
  }

  spinner.start("Initializing...");
  template === "custom"
    ? cloneCustomTemplate()
    : copyTemplateFiles(path.join(TEMPLATE_PATH, template), projectPath);

  //
  function updatePackageJson() {
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson: PackageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
    packageJson.name = name;
    packageJson.scripts = {
      ...packageJson.scripts,
      preinstall: `npx only-allow ${pkgManager}`,
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  updatePackageJson();
  // start("Initializing...");
  spinner.stop();

  // 输出提示信息
  note(
    `\u{1F449} ${lightGreen(`cd ${name}`)}\n\u{1F449} ${lightGreen(
      pkgManager === "yarn" ? "yarn" : `${pkgManager} install`
    )}`,
    "Next steps"
  );

  outro(lightYellow("Done."));
}

init().catch((err) => {
  // console.error(err);
  logger.error(err);
  process.exit(1);
});

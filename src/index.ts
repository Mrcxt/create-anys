import fs from "node:fs";
import path from "node:path";
import {
  cancel,
  isCancel,
  note,
  outro,
  select,
  text,
  intro,
  spinner,
  log,
} from "@clack/prompts";
import { logger } from "rslog";
import { fileURLToPath } from "node:url";
import { lightBlue, lightGreen, lightRed, lightYellow } from "kolorist";
import isGitUrl from "is-git-url";
import { execSync } from "node:child_process";
import minimist from "minimist";

import type { PackageJson } from "types-package-json";

const argv = minimist(process.argv.slice(2));

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

const { start, stop } = spinner();

export async function init() {
  console.log("");
  logger.greet("◆  Create Project");
  let name = (await text({
    message: "Project name",
    placeholder: "my-project",
    validate(value) {
      if (value.length === 0) {
        return "Project name is required";
      }
    },
  })) as string;

  checkCancel(name);

  name = snakeCase(name);

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
        label: "Custom",
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

  // 判断是否存在project name文件夹，如果存在，直接覆盖
  function createProjectDir() {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true });
    }
    fs.mkdirSync(projectPath);
  }

  createProjectDir();

  // 将template文件夹下的文件复制到project name文件夹下
  function copyTemplateFiles() {
    fs.readdirSync(path.join(TEMPLATE_PATH, template)).forEach((file) => {
      fs.copyFileSync(
        path.join(TEMPLATE_PATH, template, file),
        path.join(projectPath, file)
      );
    });
  }

  // 拉取远程git仓库模板到调用命令的当前路径下，并将文件夹命名为project name，并删除.git文件夹
  function cloneCustomTemplate() {
    execSync(`git clone ${customGit} ${name}`);
    fs.rmSync(path.join(projectPath, ".git"), { recursive: true });
  }

  start("Initializing...");
  template === "custom" ? cloneCustomTemplate() : copyTemplateFiles();

  // 修改package.json文件
  function updatePackageJson() {
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson: PackageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
    packageJson.name = name;
    // scripts新增preinstall:"npx only-allow npm"
    packageJson.scripts = {
      ...packageJson.scripts,
      preinstall: `npx only-allow ${pkgManager}`,
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  updatePackageJson();
  stop();

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
  console.error(err);
  process.exit(1);
});

import { styleText } from "node:util";
import packageInfo from "../package.json" with { type: "json" };

type Command = keyof typeof packageInfo.scripts;

function getHelp(command: Command) {
  const [script, help] = packageInfo.scripts[command].split("##").map((s) => s.trim());

  return `${styleText("cyan", command)} :: ${styleText("green", script)}
  ${help ?? styleText("red", "No help available. Consider append ## after script to generate help")}`;
}

function usage() {
  console.log(`${styleText("cyan", "Usage")}
  bun h
  bun h <command>`);
}

function printHelp(helpList: string[]) {
  console.log(helpList.join("\n\n"));
}

const command = process.argv[2];

if (command in packageInfo.scripts) {
  printHelp([getHelp(command as Command)]);
} else {
  usage();
  console.log();
  printHelp((Object.keys(packageInfo.scripts) as Command[]).map(getHelp));
}

import os
import re
import anthropic

tree = open("/tmp/tree.txt").read()
readme = open("README.md").read()

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system=(
        "You are a documentation maintenance assistant.\n"
        "Your only job is to update the Project Structure section of README.md.\n"
        "You must respond with ONLY the replacement content that goes between\n"
        "<!-- TREE_START --> and <!-- TREE_END --> markers.\n"
        "Do not include the markers themselves in your response.\n"
        "Do not include any explanation or commentary outside the content block."
    ),
    messages=[
        {
            "role": "user",
            "content": (
                "# Claude Project Instructions\n\n"
                "This repository uses Claude to maintain README documentation accurately "
                "without expanding it unnecessarily.\n\n"
                "# Core Rules\n\n"
                "- Only update sections affected by the current change\n"
                "- Never rewrite the entire README\n"
                "- Only modify lines that are actually outdated\n\n"
                "# What SHOULD be documented\n\n"
                "1. Top-level directories with one short explanation each\n"
                "   Examples: app/, src/, components/, lib/, docs/, scripts/\n"
                "2. Key configuration files (package.json, tsconfig.json, etc.) - purpose only\n"
                "3. Key infrastructure files - limit to 2-3 representative files per directory\n\n"
                "# What MUST NOT be documented\n\n"
                "- UI components, hooks, small utilities, tests, generated files, build artifacts\n"
                "- Patterns to ignore: *.test.ts, *.spec.ts, node_modules/, .next/, dist/, *.lock\n\n"
                "# Documentation Size Limits\n\n"
                "- Document top-level directories only\n"
                "- Maximum 3 representative files inside directories\n"
                "- Never list every file\n"
                "- Every explanation must be one short sentence\n\n"
                "# Style Rules\n\n"
                "- Keep explanations short\n"
                "- Use tree format with inline # comments\n"
                "- Maintain existing README tone\n"
                "- Prefer minimal content\n\n"
                "# Task\n\n"
                "The current directory tree of this repository is:\n\n"
                f"```\n{tree}\n```\n\n"
                "The current README.md content is:\n\n"
                f"```\n{readme}\n```\n\n"
                "Generate ONLY the replacement content for the section between "
                "<!-- TREE_START --> and <!-- TREE_END -->.\n"
                "Show only meaningful top-level directories and a few key files.\n"
                "Add a short inline description for each item using # comment style inside a code block.\n"
                "Do not list every file. Select only the most architecturally significant ones."
            ),
        }
    ],
)

new_section = message.content[0].text.strip()
new_block = f"<!-- TREE_START -->\n{new_section}\n<!-- TREE_END -->"

updated = re.sub(
    r"<!-- TREE_START -->.*?<!-- TREE_END -->",
    new_block,
    readme,
    flags=re.DOTALL,
)

with open("README.md", "w") as f:
    f.write(updated)

print("README.md updated successfully")

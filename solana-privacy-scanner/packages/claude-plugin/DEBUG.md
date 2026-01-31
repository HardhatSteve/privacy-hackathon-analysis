# Plugin Loading Debug

## Current Status

Plugin directory loads but skills not recognized: "Unknown skill: scan-code"

## Possible Issues

### 1. Skill Format
Claude Code might expect a specific skill.md format. Check if we need:
- YAML frontmatter
- Specific section headers
- Different metadata structure

### 2. Handler Export
The handler.ts might need to export in a specific way:
- Default export vs named export
- Specific function signature
- Registration mechanism

### 3. Directory Structure
Maybe skills need to be in a different location:
- Top level vs nested in skills/
- Different naming convention
- Index files

### 4. Manifest Format
The manifest.json might need different fields or structure

## Debug Steps

1. In Claude session, type: `/help`
   - See if any custom skills are listed
   - Check what format they show

2. Check Claude Code docs/examples for skill format

3. Try minimal skill to test loading:
   - Single function
   - Simple skill.md
   - Basic handler

4. Look for plugin examples in Claude Code repo

## Test Commands

From inside Claude session:
```
/help
/list-skills
```

Check if there are any environment variables or config files:
```
ls ~/.claude/
cat ~/.claude/config.json
```

## Next Steps

Based on what `/help` shows, we can determine if:
- Skills aren't loading at all
- Skills are loading but with wrong names
- Something else is preventing recognition

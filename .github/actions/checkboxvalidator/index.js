const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const context = github.context;

    // Ensure the event is a pull request
    if (context.eventName !== 'pull_request') {
      core.setFailed('This action only runs on pull request events.');
      return;
    }

    const pr = context.payload.pull_request;
    const body = pr.body || '';

    // Define regex to identify checkbox groups
    // This example assumes groups are separated by headings like ### Group Name
    const groupRegex = /###\s+[^#\n]+\n([\s\S]*?)(?=###\s+[^#\n]+|$)/g;
    const checkboxLineRegex = /- \[( |x|X)\] .+/g;

    let match;
    let allGroupsValid = true;
    let invalidGroups = [];

    while ((match = groupRegex.exec(body)) !== null) {
      const groupContent = match[1];
      const checkboxes = groupContent.match(checkboxLineRegex) || [];

      // Check if at least one checkbox is checked
      const isValid = checkboxes.some(cb => /\[x\]/i.test(cb));
      if (!isValid) {
        // Extract group name from the match
        const groupNameMatch = /###\s+([^#\n]+)/.exec(match[0]);
        const groupName = groupNameMatch ? groupNameMatch[1].trim() : 'Unnamed Group';
        invalidGroups.push(groupName);
        allGroupsValid = false;
      }
    }

    if (!allGroupsValid) {
      core.setFailed(
        `Please select at least one option in each of the following groups: ${invalidGroups.join(
          ', '
        )}`
      );
    } else {
      core.info('All checkbox groups are valid.');
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();

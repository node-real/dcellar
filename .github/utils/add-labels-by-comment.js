// Output: null
module.exports = async ({ github, context, core }) => {
	try {
		const str = context.payload.comment.body;
		const arr = str.split(':')
		const labels = arr[1].split(',');

		if (arr[0] === '/add-labels') {
			await github.rest.issues.addLabels({
				issue_number: context.issue.number,
				owner: context.repo.owner,
				repo: context.repo.repo,
				labels: labels
			})
		}
	} catch (error) {
		core.error(error.message)
	}
}

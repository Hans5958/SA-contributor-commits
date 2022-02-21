// import { Octokit } from "@octokit/rest"
// const octokit = new Octokit()
import fetch from 'node-fetch'
import fs from 'fs'
import stringifyB from 'json-beautify'

const GITHUB_TOKEN = process.env.GH_PAT

const fetchJson = async url => {

	const response = await fetch(url, {
		headers: {
			"User-Agent": "Hans5958",
			Accept: "application/vnd.github.v3+json",
			Authorization: `token ${GITHUB_TOKEN}`
		}
	})
	return await response.json()
}

/**
 * Respond to the request
 * @param {Request} request
 */
const handleRequest = async request => {
	try {
		const org = "ScratchAddons"
		// const { data } = await octokit.repos.listForOrg({org})
		const data = await fetchJson(`https://api.github.com/orgs/${org}/repos`)
		const repos = data.filter(repo => repo.fork === false).map(repo => repo.name)
		const totalContributors = []
		await Promise.all(repos.map(async repo => {
			// const { data } = await octokit.repos.listContributors({owner: org, repo})
			const data = await fetchJson(`https://api.github.com/repos/${org}/${repo}/contributors`)
				.catch(r => {
					console.log(r)
					return []
				})
			// console.log(data)
			data.forEach(contributor => {
				if (contributor.type === "User") {
					const index = totalContributors.findIndex(i => i.login === contributor.login)
					if (index === -1) {
						totalContributors.push({
							login: contributor.login,
							contributions: contributor.contributions,
							avatar_url: contributor.avatar_url
						})
					} else {
						totalContributors[index].contributions += contributor.contributions
					}
				}
			})
		}))
		totalContributors.sort((a, b, field='login') => (a[field] > b[field]) - (a[field] < b[field]))
		// console.log(stringifyB(totalContributors, null, '\t'))
		fs.writeFileSync('contributors.json', stringifyB(totalContributors, null, '\t'))
		// return new Response(JSON.stringify(totalContributors), {
		// 	status: 200,
		// 	headers: {
		// 		"Content-Type": "application/json;charset=UTF-8",
		// 		"Cache-Control": "max-age=60",
		// 		"Access-Control-Allow-Origin": "*"
		// 	}
		// })
	} catch (e) {
		console.error(e)
		// return new Response(e, { status: 503 })
	}
}

handleRequest()

console.log(`::set-output name=TIMESTAMP::${new Date().toISOString()}`)
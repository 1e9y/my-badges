import {Octokit} from 'octokit'
import {Badge} from './badges.js'
import {quoteAttr} from './utils.js'

export async function updateReadme(octokit: Octokit, owner: string, repo: string, badges: Badge[]) {
  console.log('Loading README.md')
  const readme = await octokit.request<'readme'>('GET /repos/{owner}/{repo}/readme', {
    owner, repo,
  })

  let content = Buffer.from(readme.data.content, 'base64').toString('utf8')
  const start = content.indexOf('<!-- my-badges start -->')
  const end = content.indexOf('<!-- my-badges end -->')
  if (start !== -1 && end !== -1) {
    content = content.slice(0, start) + content.slice(end + 25)

    const badgesHtml = badges.map(badge => {
      const desc = quoteAttr(badge.desc)
      return `<a href="my-badges/${badge.id}.md"><img src="${badge.image}" alt="${desc}" title="${desc}" width="60"></a>`
    }).join('\n')

    content = content.slice(0, start) +
      '<!-- my-badges start -->\n' +
      '<h4><a href="https://github.com/my-badges/my-badges">My Badges</a></h4>\n\n' +
      badgesHtml +
      '\n<!-- my-badges end -->\n' +
      content.slice(start)
  }

  console.log('Updating README.md')
  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner, repo,
    path: readme.data.path,
    message: 'Update my-badges',
    committer: {
      name: 'My Badges',
      email: 'my-badges@github.com',
    },
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha: readme.data.sha,
  })
}

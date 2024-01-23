#!/usr/bin/env node

import Ora from 'ora';
import Table from 'cli-table';
import {
	getData,
	getStringifier,
	currentTime,
} from '../../../../services/utils.js';
import * as speak from '../../../../services/style-utils.js';
import { tableChars } from '../../../../services/style-utils.js';
import exportGithubOrgUsers from './export-github-org-users.js';

const spinner = Ora();

const tableHead = ['Organization', 'No. of users'].map((h) =>
	speak.successColor(h),
);

const exportGithubEnterpriseUsers = async (options) => {
	try {
		const table = new Table({
			chars: tableChars,
			head: tableHead,
		});
		const { outputFile, usersFile, enterpriseOrganizations } = options;
		let enterpriseUsers = [];

		if (usersFile) {
			const usersData = await getData(usersFile);
			enterpriseUsers = usersData.map((row) => row.login.toLowerCase());
		}

		spinner.start('Fetching enterprise users...');
		const outputFileName =
			(outputFile && outputFile.endsWith('.csv') && outputFile) ||
			`enterprise-users-${currentTime()}.csv`;
		const stringifier = getStringifier(outputFileName, ['login']);
		const usersSet = new Set();

		for (let org of enterpriseOrganizations) {
			options.organization = org;
			options.return = true;
			const orgUsersData = await exportGithubOrgUsers(options);
			const orgUsers = orgUsersData.map((user) => user.login.toLowerCase());
			let usersCount = 0;

			for (const user of orgUsers) {
				if (enterpriseUsers.length > 0 && !enterpriseUsers.includes(user))
					continue;

				usersCount++;
				usersSet.add(user);
			}

			table.push([org, usersCount]);
		}

		for (const user of usersSet.keys()) {
			stringifier.write({ login: user });
		}

		console.log(table.toString());
		stringifier.end();
		spinner.succeed('Successfully fetched enterprise users...');
	} catch (error) {
		speak.error(error);
		speak.error('Failed to export enterprise users');
	}
};

export default exportGithubEnterpriseUsers;

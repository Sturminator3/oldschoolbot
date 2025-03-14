import { ApplicationCommandOptionType, CommandRunOptions } from 'mahoji';

import { mileStoneBaseDeathChances, RaidLevel, toaHelpCommand, toaStartCommand } from '../../lib/simulation/toa';
import { deferInteraction } from '../../lib/util/interactionReply';
import { minionIsBusy } from '../../lib/util/minionIsBusy';
import { coxCommand, coxStatsCommand } from '../lib/abstracted_commands/coxCommand';
import { tobCheckCommand, tobStartCommand, tobStatsCommand } from '../lib/abstracted_commands/tobCommand';
import { OSBMahojiCommand } from '../lib/util';

export const raidCommand: OSBMahojiCommand = {
	name: 'raid',
	description: 'Send your minion to do raids - CoX or ToB.',
	attributes: {
		requiresMinion: true
	},
	options: [
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'cox',
			description: 'The Chambers of Xeric.',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'start',
					description: 'Start a Chambers of Xeric trip',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'type',
							description: 'Choose whether you want to solo or mass.',
							choices: ['solo', 'mass'].map(i => ({ name: i, value: i })),
							required: true
						},
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'challenge_mode',
							description: 'Choose whether you want to do Challenge Mode.',
							required: false
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'stats',
					description: 'Check your CoX stats.'
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'tob',
			description: 'The Theatre of Blood.',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'start',
					description: 'Start a Theatre of Blood trip',
					options: [
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'hard_mode',
							description: 'Choose whether you want to do Hard Mode.',
							required: false
						},
						{
							type: ApplicationCommandOptionType.Integer,
							name: 'max_team_size',
							description: 'Choose a max size for your team.',
							required: false
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'stats',
					description: 'Check your ToB stats.'
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'check',
					description: "Check if you're ready for ToB.",
					options: [
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'hard_mode',
							description: 'Choose whether you want to check Hard Mode.',
							required: false
						}
					]
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: 'toa',
			description: 'The Tombs of Amascut.',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'start',
					description: 'Start a Tombs of Amascut trip',
					options: [
						{
							type: ApplicationCommandOptionType.Number,
							name: 'raid_level',
							description: 'Choose the raid level you want to do (1-600).',
							required: true,
							choices: mileStoneBaseDeathChances.map(i => ({ name: i.level.toString(), value: i.level }))
						},
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'solo',
							description: 'Do you want to solo?',
							required: false
						},
						{
							type: ApplicationCommandOptionType.Integer,
							name: 'max_team_size',
							description: 'Choose a max size for your team.',
							required: false,
							min_value: 1,
							max_value: 8
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'help',
					description: 'Shows helpful information and stats about TOA.'
				}
			]
		}
	],
	run: async ({
		interaction,
		options,
		userID,
		channelID
	}: CommandRunOptions<{
		cox?: { start?: { type: 'solo' | 'mass'; challenge_mode?: boolean; quantity?: number }; stats?: {} };
		tob?: { start?: { hard_mode?: boolean; max_team_size?: number }; stats?: {}; check?: { hard_mode?: boolean } };
		toa?: {
			start?: { raid_level: RaidLevel; max_team_size?: number; solo?: boolean };
			help?: {};
		};
	}>) => {
		if (interaction) await deferInteraction(interaction);
		const user = await mUserFetch(userID);
		const { cox, tob } = options;
		if (cox?.stats) return coxStatsCommand(user);
		if (tob?.stats) return tobStatsCommand(user);
		if (tob?.check) return tobCheckCommand(user, Boolean(tob.check.hard_mode));
		if (options.toa?.help) return toaHelpCommand(user, channelID);

		if (minionIsBusy(user.id)) return "Your minion is busy, you can't do this.";

		if (cox && cox.start) {
			return coxCommand(channelID, user, cox.start.type, Boolean(cox.start.challenge_mode), cox.start.quantity);
		}
		if (tob?.start) {
			return tobStartCommand(user, channelID, Boolean(tob.start.hard_mode), tob.start.max_team_size);
		}

		if (options.toa?.start) {
			return toaStartCommand(
				user,
				Boolean(options.toa.start.solo),
				channelID,
				options.toa.start.raid_level,
				options.toa.start.max_team_size
			);
		}

		return 'Invalid command.';
	}
};

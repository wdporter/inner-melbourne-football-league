
	import { createApp, ref, watchEffect } from "vue"

	
	createApp({
		setup() {
			const currentYear = ref(2025)
			const years = Array.from({ length: currentYear.value - 1982 + 1 }, (x, i) => i + 1982).reverse()
			const seasons = ref({})
			const soft = ref(false)

			const invalidate = () => seasons.value = {}

			watchEffect(async () => {

				if (currentYear.value in seasons.value) {
					return
				}

				const url = `https://api.squiggle.com.au?q=games&year=${currentYear.value}`
				const data = await (await fetch(url)).json()
				console.log(data)
	
				const imposters = ["West Coast", "Greater Western Sydney", "Fremantle", "Adelaide", "Port Adelaide", "Gold Coast"]

				if (!soft.value) {
					imposters.push("Sydney");
					imposters.push("Brisbane Lions")
				}
				const filteredGames = data.games.filter(game => {
					return ! (imposters.includes(game.hteam) || imposters.includes(game.ateam))
				})
				filteredGames.forEach(game => {
					if (game.hteam == "Sydney")
						game.hteam = "South Melbourne"
					if (game.ateam == "Sydney")
						game.ateam = "South Melbourne"
					if (game.hteam == "Brisbane Lions")
						game.hteam = "Fitzroy"
					if (game.ateam == "Brisbane Lions")
						game.ateam = "Fitzroy"
					if (game.hteam == "Western Bulldogs")
						game.hteam = "Footscray"
					if (game.ateam == "Western Bulldogs")
						game.ateam = "Footscray"

					// delete game.ateamid
					// delete game.complete
					// delete game.date
					// delete game.hteamid
					// delete game.id
					// delete game.is_grand_final
					// delete game.localtime
					// delete game.roundname
					// delete game.timestr
					// delete game.tz
					// delete game.unixtime
					// delete game.updated
					// delete game.venue
					// delete game.winner
					// delete game.winnerteamid
				})
				const grouped = Object.groupBy(filteredGames, ({is_final}) => is_final == 0 ? "regular" : "finals")
				grouped.regular = Object.groupBy(grouped.regular, ({round}) => round)
				if (grouped.finals == undefined)
					grouped.finals = {}
				else
					grouped.finals = Object.groupBy(grouped.finals, ({round}) => round)
				//seasons.value[data.games[0].year] = filteredGames
				seasons.value[currentYear.value] = grouped

				// now create a ladder
				seasons.value[currentYear.value].ladder = []
				filteredGames.forEach((game) => {
					if (!seasons.value[currentYear.value].ladder.find(x => x.name==game.hteam)) {
						// teams need to be initialised
						seasons.value[currentYear.value].ladder.push({
							name: game.hteam,
							wins: 0,
							draws: 0,
							losses: 0,
							for: 0,
							against: 0
					})}
					if (!seasons.value[currentYear.value].ladder.find(x => x.name==game.ateam)) {
						// teams need to be initialised
						seasons.value[currentYear.value].ladder.push({
							name: game.ateam,
							wins: 0,
							draws: 0,
							losses: 0,
							for: 0,
							against: 0
					})}

					// find the home team and update it
					let team = seasons.value[currentYear.value].ladder.find(x => x.name == game.hteam)
					if (game.hscore > game.ascore)
						team.wins++
					else if (game.hscore < game.ascore)
						team.losses++	
					else
						team.draws++
					team.for += game.hscore
					team.against += game.ascore
					// find the away team and update it
					team = seasons.value[currentYear.value].ladder.find(x => x.name == game.ateam)
					if (game.ascore > game.hscore)
						team.wins++
					else if (game.ascore < game.hscore)
						team.losses++
					else
						team.draws++
					team.for += game.ascore
					team.against += game.hscore
				})

				seasons.value[currentYear.value].ladder.sort(function(a, b) {
					const apoints = (a.wins * 4) + (a.draws * 2)
					const bpoints = (b.wins * 4) + (b.draws* 2)
					if (apoints < bpoints)
						return 1
					else if (apoints > bpoints)
						return -1
					const apercent = a.for / a.against
					const bpercent = b.for / b.against
					if (apercent < bpercent)
						return 1
					else if (apercent > bpercent)
						return -1
					else return 0
				})
			})

			return {
				currentYear,
				years,
				seasons,
				soft,
				invalidate
			}
	}
}).mount(app)
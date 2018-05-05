const debug = process.env.DEBUG
const minLength = 9
const resetColor = '\x1b[0m'
const terminalColors = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
}

module.exports = function (name, color = 'green', debugOnly = false) {
	const isBrowser = typeof window !== 'undefined'
	let prefix = name + ' '
	while (prefix.length < minLength)
		prefix += ' '
	prefix += '|'
	if (isBrowser)
		return (...args) => {
			console.log(`%c${prefix}%c`, `color: ${color}`, `color: black`, ...args)
		}

	if (debugOnly && !debug) return () => undefined
	return (...args) => {
		const colorCode = terminalColors[color] || terminalColors.white
		const time = new Date()
		const timeStamp = twoDigits(time.getHours()) + ':' + twoDigits(time.getMinutes()) + ':' + twoDigits(time.getSeconds())
		console.log(colorCode + (timeStamp + ' '  + prefix) + resetColor, ...args)
	}
}

function twoDigits(d) {
	if (0 <= d && d < 10) return "0" + d.toString()
	if (-10 < d && d < 0) return "-0" + (-1 * d).toString()
	return d.toString()
}
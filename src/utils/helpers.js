let checkFunc = function (data) {
    return !(data && data !== 'undefined' && data.length && data !== 'null' && Boolean(data) !== false)
}
let includeFunc = function (data, content = '') {
    return (checkFunc(data)) ? content:((content) ? content + ' ' : content) + data
}

function assign(data, obj) {
    if (checkFunc(data)) return obj;
    
    // If data is already an object, use it directly
    if (typeof data === 'object') {
        return Object.assign(obj, data);
    }
    
    // If data is a string, try to parse it as JSON
    try {
        const parsed = JSON.parse(data);
        return Object.assign(obj, parsed);
    } catch (e) {
        console.error('Failed to parse data as JSON:', data);
        return obj;
    }
}

function replaceFunc(data, content) {

    let obj = {}

    let result = content

    data.forEach((i) => obj = assign(i, obj))

    obj[process.env.TARGET] = (!checkFunc(process.env.VERCEL_URL)) ? process.env.VERCEL_URL : ''

    result = result.replace(new RegExp(Object.keys(obj).join("|"), "g"), (m) => obj[m])

    return result

}

export {includeFunc, replaceFunc}
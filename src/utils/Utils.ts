const groupedLog = (title: string, ...args: any[]) => {
    console.groupCollapsed(title)
    args.forEach(arg => console.log(arg));
    console.groupEnd();
}

export { groupedLog };
class MindUpLayoutSvc{
    loadStyles=(ndsSet)=> {
        if (!ndsSet) {
            return;
        }
        console.log("load style for up layout: ", ndsSet);
    }
}

export default new MindUpLayoutSvc();
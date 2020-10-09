class GeneralSvc{
    /**
     * 判断路径是否合法：不带中文、不带空格、不带全角字符
     * @param {1} path 
     */
    isPathValid=(path)=>{
        let hasInvalidChar=invalidChars.some(char=>path.indexOf(char)>=0);
        if(hasInvalidChar){
            return false;
        }
        if(cnReg.test(path)){
            return false;
        }
        return true;
    }

}

const invalidChars=[' ','　','（','）','【','】','｛','｝'];
const cnReg=/^.*[\u4E00-\u9FA5].*$/;

export default new GeneralSvc();
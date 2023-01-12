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

    getDlgTopArrowStyle=({left,top,len,color})=>{
        return {
            position:'absolute', 
            left: `${left}px`, 
            top : `${top}px`,  
            width: '0px',
            height: '0px',
            borderTop: '0px solid transparent',
            borderBottom: `${len}px solid ${color}`,
            borderLeft: `${len}px solid transparent`,
            borderRight: `${len}px solid transparent`,
            backgroundColor:'transparent',
        };
    };

}

const invalidChars=[' ','　','（','）','【','】','｛','｝'];
const cnReg=/^.*[\u4E00-\u9FA5].*$/;

const inst=new GeneralSvc();
export default inst;
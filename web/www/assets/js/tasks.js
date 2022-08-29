let waiting = false;
let ct;
export async function rtk(){
    if( !waiting ){
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const response = await fetch('/token', {
            method: 'GET',
            signal: controller.signal
        });
        const json = await response.json();
        if( json.token == 'FAILED' ){
            return false;
        }else{
            ct = json.token;
            wait(8000);
            return ct;
        }
    }else{ return ct }
}
async function wait(ms){
    waiting = true;
    setTimeout(() => { waiting = false }, ms)
}
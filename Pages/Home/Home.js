const SliderOpen=document.getElementById('checkbtn');
const Sidemenu=document.getElementById('sidemenu')
SliderOpen.onclick=function Myfunction(){
    if(Sidemenu.style.left=='-100%'){
        Sidemenu.style.left='0px'
    }else{
        Sidemenu.style.left='-100%'
    }
}


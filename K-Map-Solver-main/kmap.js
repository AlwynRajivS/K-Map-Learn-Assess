const KM={
 G2:["0","1"],G4:["00","01","11","10"],
 config(v){
 if(v===2)return{R:2,C:2,rv:["A"],cv:["B"],rl:this.G2,cl:this.G2};
 if(v===3)return{R:2,C:4,rv:["A"],cv:["B","C"],rl:this.G2,cl:this.G4};
 if(v===4)return{R:4,C:4,rv:["A","B"],cv:["C","D"],rl:this.G4,cl:this.G4};
 return{R:4,C:8,rv:["A","B"],cv:["E","C","D"],rl:this.G4,cl:["000","001","011","010","100","101","111","110"]}
},
 mt(v,r,c){let q=this.config(v);return parseInt(q.rl[r]+q.cl[c],2)},
 intervals(n){let out=[],seen=new Set;for(let l=1;l<=n;l*=2)for(let s=0;s<n;s++){let a=[];for(let k=0;k<l;k++)a.push((s+k)%n);a.sort((a,b)=>a-b);let z=a.join();if(!seen.has(z)){seen.add(z);out.push(a)}}return out}
};
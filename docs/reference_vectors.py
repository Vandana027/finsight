# Independent reference implementations (loops / amortisation schedules, not the closed forms used in the app).
import math, json
def sip_loop(m, r, years, per_year):           # start-of-period instalments
    i=r/100/per_year; bal=0
    for _ in range(round(years*per_year)): bal=(bal+m)*(1+i)
    return bal
def lump(p,r,y): 
    b=p
    for _ in range(int(y)): b*=1+r/100
    return b
def emi_schedule(P,r,n):                        # find EMI by bisection so the schedule ends at zero
    lo,hi=0,P
    for _ in range(200):
        mid=(lo+hi)/2; b=P
        for _ in range(n): b=b*(1+r/1200)-mid
        if b>0: lo=mid
        else: hi=mid
    return hi
def step_up(s,step,r,y):
    bal=0;inv=0;m=s
    for _ in range(y):
        for _ in range(12): bal=(bal+m)*(1+r/1200); inv+=m
        m*=1+step/100
    return bal,inv
def ppf(amount,rate,years,per_year):
    gap=12//per_year; bal=0; inv=0
    for _ in range(years):
        interest=0
        for m in range(12):
            if m%gap==0: bal+=amount; inv+=amount
            interest+=bal*rate/100/12
        bal+=interest
    return bal,inv
def rd(m,rate,months):
    g=(1+rate/400)**(1/3); bal=0
    for _ in range(months): bal=(bal+m)*g
    return bal
def comp_dep(p,rate,years,cf,dep,df):
    g=(1+rate/100/cf)**(cf/12); bal=p
    for k in range(years*12):
        if k%(12//df)==0: bal+=dep
        bal*=g
    return bal
def dcf(fcf,d,g1,g2,t,netdebt,shares):
    cf=fcf;pv=0
    for y in range(1,11):
        cf*=1+(g1 if y<=5 else g2)/100; pv+=cf/(1+d/100)**y
    tv=cf*(1+t/100)/(d/100-t/100)/(1+d/100)**10
    return (pv+tv-netdebt)/shares
def retire(age,ret_age,life,r,annual,inf):
    yrs=ret_age-age; n=life-ret_age
    w=annual*(1+inf/100)**yrs
    corpus=sum(w*(1+inf/100)**k/(1+r/100)**k for k in range(n))   # withdrawals at start of each year
    i=r/1200;f=0
    for _ in range(yrs*12): f=(f+1)*(1+i)
    return corpus,corpus/f
V={}
V['lumpsum']=lump(100000,12,10)
V['lumpsum_reference_example']=lump(100000,15,60)
V['sip_m']=sip_loop(10000,12,10,12); V['sip_y']=sip_loop(10000,12,10,1)
V['goal_sip_m']=5e6/sip_loop(1,12,10,12); V['goal_sip_y']=5e6/sip_loop(1,12,10,1)
V['goal_sip_m_inf']=5e6*1.06**10/sip_loop(1,12,10,12)
c,s=retire(30,60,85,10,600000,6); V['retire_corpus']=c; V['retire_sip']=s
V['step_up']=step_up(10000,10,12,10)
V['dcf']=dcf(1000,12,10,5,4,0,100)
V['emi']=emi_schedule(2500000,8.5,240)
acc=1000000*.095*5
V['ppf_y']=ppf(150000,7.1,15,1); V['ppf_m']=ppf(12500,7.1,15,12)
V['fd_q']=500000*(1+.07/4)**20; V['fd_y']=500000*1.07**5; V['fd_m']=500000*(1+.07/12)**60
V['rd']=rd(10000,6.5,60)
V['comp_dep']=comp_dep(100000,8,10,4,5000,12); V['comp_fin_example']=comp_dep(0,10,10,4,100,12)
V['cagr']=((250000/100000)**(1/5)-1)*100
fut=2500000*1.08**15
print(json.dumps(V,indent=0))



var isDefined = function isDefined(v){
    return (v != undefined) && !isNaN(v);
}

var sortList = function sortList(list,sort){
    if(null == sort.property || null == sort.direction){
        log.trace("invalid sort object");
    }else{
        log.trace("valid sort object");
        var dir=1;
        if("ASC" == sort.direction)
            dir = -1;
        list.sort(function(a,b){
            // this sort will fail for non-string elements.
            //log.trace("sort:",a,b);
            var ap = a[sort.property]; 
            var bp = b[sort.property];
            if(null != ap && null != bp){
                if(ap.toUpperCase() == bp.toUpperCase())
                    return 0
                return dir*((ap.toUpperCase() < bp.toUpperCase())*2-1);
            }else if(null != ap){
                return dir;
            }else if(null != bp){
                return -1*dir;
            }else{
                return 0;
            }
        });
    }
    return list;
}

exports.formatList = function formatList(list,page,start,limit,sort){
    var list;
    var totalLength = list.length;
    
    if(!list)
        return {"success":false};
        
    // if necessary, sort the results
    if(undefined != sort){
        sort = JSON.parse(sort);
        log.trace("sort ", sort);
        for(var i in sort){
            sortList(list,sort[i]);
        }
    }    
    // if we don't have start, try using page to deduce start
    if( !isDefined(start) && isDefined(page) && isDefined(limit)){
        start = (page-1)*limit;
    }
    
    // slice if it makes sense
    if(isDefined(start) && isDefined(limit) && start >=0 && limit >= 0){
        log.trace("return results "+start+" to "+(start+limit-1));
        list = list.slice(start,start+limit);
    }
    
    for(var i in list)
        list[i].ID = list[i].Name;

    return {
            "success" : true,
            "results": totalLength,
            "rows": list
        };
}

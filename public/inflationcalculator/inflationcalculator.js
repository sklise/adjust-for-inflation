// Compiled by ClojureScript 0.0-2030
goog.provide('inflationcalculator.inflationcalculator');
goog.require('cljs.core');
goog.require('cljs.core.async');
goog.require('goog.Uri');
goog.require('goog.net.Jsonp');
goog.require('cljs.core.async');
goog.require('goog.events');
goog.require('goog.events');
goog.require('goog.dom');
goog.require('goog.dom');
inflationcalculator.inflationcalculator.cpis = cljs.core.PersistentHashMap.fromArrays([2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014],[172.2,177.1,179.9,184.0,188.9,195.3,201.6,207.342,215.303,214.537,218.056,224.939,229.594,233.069,233.069]);
inflationcalculator.inflationcalculator.listen = (function listen(el,type){var out = cljs.core.async.chan.call(null);goog.events.listen(el,type,(function (e){return cljs.core.async.put_BANG_.call(null,out,e);
}));
return out;
});
inflationcalculator.inflationcalculator.get_value = (function get_value(id){return goog.dom.getElement(id).value;
});
inflationcalculator.inflationcalculator.discount = (function() {
var discount = null;
var discount__3 = (function (table,amount,target_year){return discount.call(null,amount,(new Date()).getFullYear(),target_year,table);
});
var discount__4 = (function (table,amount,base_year,target_year){return (amount * (cljs.core.get.call(null,table,target_year) / cljs.core.get.call(null,table,base_year)));
});
discount = function(table,amount,base_year,target_year){
switch(arguments.length){
case 3:
return discount__3.call(this,table,amount,base_year);
case 4:
return discount__4.call(this,table,amount,base_year,target_year);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
discount.cljs$core$IFn$_invoke$arity$3 = discount__3;
discount.cljs$core$IFn$_invoke$arity$4 = discount__4;
return discount;
})()
;
inflationcalculator.inflationcalculator.bind_key = (function bind_key(num,input){console.log("hi");
var clicks = inflationcalculator.inflationcalculator.listen.call(null,goog.dom.getElement([cljs.core.str("key-"),cljs.core.str(num)].join('')),"click");var output = goog.dom.getElement(input);var c__5494__auto__ = cljs.core.async.chan.call(null,1);cljs.core.async.impl.dispatch.run.call(null,(function (){var f__5495__auto__ = (function (){var switch__5424__auto__ = (function (state_16364){var state_val_16365 = (state_16364[1]);if((state_val_16365 === 7))
{var inst_16353 = (state_16364[2]);var inst_16354 = output.value;var inst_16355 = [cljs.core.str(inst_16354),cljs.core.str(num)].join('');var inst_16356 = output.value = inst_16355;var state_16364__$1 = (function (){var statearr_16366 = state_16364;(statearr_16366[7] = inst_16356);
(statearr_16366[8] = inst_16353);
return statearr_16366;
})();var statearr_16367_16380 = state_16364__$1;(statearr_16367_16380[2] = null);
(statearr_16367_16380[1] = 2);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_16365 === 6))
{var inst_16360 = (state_16364[2]);var state_16364__$1 = state_16364;var statearr_16368_16381 = state_16364__$1;(statearr_16368_16381[2] = inst_16360);
(statearr_16368_16381[1] = 3);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_16365 === 5))
{var state_16364__$1 = state_16364;var statearr_16369_16382 = state_16364__$1;(statearr_16369_16382[2] = null);
(statearr_16369_16382[1] = 6);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_16365 === 4))
{var state_16364__$1 = state_16364;return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null,state_16364__$1,7,clicks);
} else
{if((state_val_16365 === 3))
{var inst_16362 = (state_16364[2]);var state_16364__$1 = state_16364;return cljs.core.async.impl.ioc_helpers.return_chan.call(null,state_16364__$1,inst_16362);
} else
{if((state_val_16365 === 2))
{var state_16364__$1 = state_16364;if(true)
{var statearr_16370_16383 = state_16364__$1;(statearr_16370_16383[1] = 4);
} else
{var statearr_16371_16384 = state_16364__$1;(statearr_16371_16384[1] = 5);
}
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if((state_val_16365 === 1))
{var state_16364__$1 = state_16364;var statearr_16372_16385 = state_16364__$1;(statearr_16372_16385[2] = null);
(statearr_16372_16385[1] = 2);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{return null;
}
}
}
}
}
}
}
});return ((function (switch__5424__auto__){
return (function() {
var state_machine__5425__auto__ = null;
var state_machine__5425__auto____0 = (function (){var statearr_16376 = (new Array(9));(statearr_16376[0] = state_machine__5425__auto__);
(statearr_16376[1] = 1);
return statearr_16376;
});
var state_machine__5425__auto____1 = (function (state_16364){while(true){
var ret_value__5426__auto__ = (function (){try{while(true){
var result__5427__auto__ = switch__5424__auto__.call(null,state_16364);if(cljs.core.keyword_identical_QMARK_.call(null,result__5427__auto__,new cljs.core.Keyword(null,"recur","recur",1122293407)))
{{
continue;
}
} else
{return result__5427__auto__;
}
break;
}
}catch (e16377){if((e16377 instanceof Object))
{var ex__5428__auto__ = e16377;var statearr_16378_16386 = state_16364;(statearr_16378_16386[5] = ex__5428__auto__);
cljs.core.async.impl.ioc_helpers.process_exception.call(null,state_16364);
return new cljs.core.Keyword(null,"recur","recur",1122293407);
} else
{if(new cljs.core.Keyword(null,"else","else",1017020587))
{throw e16377;
} else
{return null;
}
}
}})();if(cljs.core.keyword_identical_QMARK_.call(null,ret_value__5426__auto__,new cljs.core.Keyword(null,"recur","recur",1122293407)))
{{
var G__16387 = state_16364;
state_16364 = G__16387;
continue;
}
} else
{return ret_value__5426__auto__;
}
break;
}
});
state_machine__5425__auto__ = function(state_16364){
switch(arguments.length){
case 0:
return state_machine__5425__auto____0.call(this);
case 1:
return state_machine__5425__auto____1.call(this,state_16364);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
state_machine__5425__auto__.cljs$core$IFn$_invoke$arity$0 = state_machine__5425__auto____0;
state_machine__5425__auto__.cljs$core$IFn$_invoke$arity$1 = state_machine__5425__auto____1;
return state_machine__5425__auto__;
})()
;})(switch__5424__auto__))
})();var state__5496__auto__ = (function (){var statearr_16379 = f__5495__auto__.call(null);(statearr_16379[cljs.core.async.impl.ioc_helpers.USER_START_IDX] = c__5494__auto__);
return statearr_16379;
})();return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped.call(null,state__5496__auto__);
}));
return c__5494__auto__;
});
inflationcalculator.inflationcalculator.bind_input = (function bind_input(i){return (function (n){return inflationcalculator.inflationcalculator.bind_key.call(null,n,i);
});
});
inflationcalculator.inflationcalculator.bind_number_key = inflationcalculator.inflationcalculator.bind_input.call(null,"input-val");
var iter__3819__auto___16392 = (function iter__16388(s__16389){return (new cljs.core.LazySeq(null,(function (){var s__16389__$1 = s__16389;while(true){
var temp__4092__auto__ = cljs.core.seq.call(null,s__16389__$1);if(temp__4092__auto__)
{var s__16389__$2 = temp__4092__auto__;if(cljs.core.chunked_seq_QMARK_.call(null,s__16389__$2))
{var c__3817__auto__ = cljs.core.chunk_first.call(null,s__16389__$2);var size__3818__auto__ = cljs.core.count.call(null,c__3817__auto__);var b__16391 = cljs.core.chunk_buffer.call(null,size__3818__auto__);if((function (){var i__16390 = 0;while(true){
if((i__16390 < size__3818__auto__))
{var n = cljs.core._nth.call(null,c__3817__auto__,i__16390);cljs.core.chunk_append.call(null,b__16391,console.log("hey"));
{
var G__16393 = (i__16390 + 1);
i__16390 = G__16393;
continue;
}
} else
{return true;
}
break;
}
})())
{return cljs.core.chunk_cons.call(null,cljs.core.chunk.call(null,b__16391),iter__16388.call(null,cljs.core.chunk_rest.call(null,s__16389__$2)));
} else
{return cljs.core.chunk_cons.call(null,cljs.core.chunk.call(null,b__16391),null);
}
} else
{var n = cljs.core.first.call(null,s__16389__$2);return cljs.core.cons.call(null,console.log("hey"),iter__16388.call(null,cljs.core.rest.call(null,s__16389__$2)));
}
} else
{return null;
}
break;
}
}),null,null));
});iter__3819__auto___16392.call(null,cljs.core.range.call(null,0,9));
inflationcalculator.inflationcalculator.init = (function init(){inflationcalculator.inflationcalculator.bind_number_key.call(null,1);
inflationcalculator.inflationcalculator.bind_number_key.call(null,2);
inflationcalculator.inflationcalculator.bind_number_key.call(null,3);
inflationcalculator.inflationcalculator.bind_number_key.call(null,4);
inflationcalculator.inflationcalculator.bind_number_key.call(null,5);
inflationcalculator.inflationcalculator.bind_number_key.call(null,6);
inflationcalculator.inflationcalculator.bind_number_key.call(null,7);
inflationcalculator.inflationcalculator.bind_number_key.call(null,8);
inflationcalculator.inflationcalculator.bind_number_key.call(null,9);
inflationcalculator.inflationcalculator.bind_number_key.call(null,0);
return inflationcalculator.inflationcalculator.bind_number_key.call(null,".");
});
inflationcalculator.inflationcalculator.init.call(null);

//# sourceMappingURL=inflationcalculator.js.map
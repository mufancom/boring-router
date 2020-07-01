(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{lfRB:function(e,t,n){"use strict";n.r(t),n.d(t,"_frontmatter",(function(){return r})),n.d(t,"default",(function(){return b}));n("5hJT"),n("W1QL"),n("K/PF"),n("t91x"),n("75LO"),n("PJhk"),n("mXGw");var a=n("/FXl"),o=n("TjRS");n("aD51");function i(){return(i=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e}).apply(this,arguments)}var r={};void 0!==r&&r&&r===Object(r)&&Object.isExtensible(r)&&!r.hasOwnProperty("__filemeta")&&Object.defineProperty(r,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"doc/references/lifecycle-hooks.md"}});var l={_frontmatter:r},c=o.a;function b(e){var t=e.components,n=function(e,t){if(null==e)return{};var n,a,o={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,["components"]);return Object(a.b)(c,i({},l,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("h1",{id:"lifecycle-hooks"},"Lifecycle Hooks"),Object(a.b)("h2",{id:"overview"},"Overview"),Object(a.b)("p",null,"Boring Router is a state-first router of which the core has nothing to do with React components. This makes Boring Router fundamentally different with ",Object(a.b)("a",i({parentName:"p"},{href:"https://github.com/ReactTraining/react-router"}),"React Router")," and removes the first barrier providing full lifecycle hooks."),Object(a.b)("p",null,'The second barrier of full lifecycle hooks support is browser history stack. As navigation can happen without accessing the router managed by us (e.g., user clicking "back", "forward" and even "goto"), it is unavoidable for lifecycle hooks like ',Object(a.b)("inlineCode",{parentName:"p"},"beforeEnter")," to be called after the navigation actually happens. To support ",Object(a.b)("inlineCode",{parentName:"p"},"before")," hooks, we need to acquire the ability to restore history stack to a previous state. Otherwise, we will have broken browser navigation behavior. To solve this problem, we choose to implement our own ",Object(a.b)("inlineCode",{parentName:"p"},"BrowserHistory")," with the ability to track and restore history stack instead of using the popular ",Object(a.b)("a",i({parentName:"p"},{href:"https://github.com/ReactTraining/history"}),"history")," package."),Object(a.b)("p",null,"Those make it possible for Boring Router to support full lifecycle hooks: ",Object(a.b)("inlineCode",{parentName:"p"},"before/will/after")," x ",Object(a.b)("inlineCode",{parentName:"p"},"enter/update/leave"),"."),Object(a.b)("blockquote",null,Object(a.b)("p",{parentName:"blockquote"},"Check out an example ",Object(a.b)("a",{href:"https://codesandbox.io/s/github/makeflow/boring-router/tree/master/packages/examples/lifecycle-hooks?file=/main.tsx&expanddevtools=1",target:"_blank"},"here"),".")),Object(a.b)("h2",{id:"hook-phases"},"Hook Phases"),Object(a.b)("h3",{id:"before-hooks"},"Before Hooks"),Object(a.b)("p",null,'"Before hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"beforeEnter"),"/",Object(a.b)("inlineCode",{parentName:"p"},"beforeUpdate"),"/",Object(a.b)("inlineCode",{parentName:"p"},"beforeLeave"),') are called before applying a navigation. All of the "before hooks" support asynchronous callbacks and allow cancellation or interruption in between. This means if another navigation is queued before "before" phase completes, the current navigation will be interrupted.'),Object(a.b)("p",null,"So besides returning ",Object(a.b)("inlineCode",{parentName:"p"},"false"),' in a "before hook" to cancel a navigation, it is designed to allow additional navigation within a "before hook" to interrupt current navigation:'),Object(a.b)("pre",null,Object(a.b)("code",i({parentName:"pre"},{className:"language-ts"}),"route.task.numericId.$beforeEnter(async next => {\n  let id = await getTaskIdByNumericId(next.$params.numericId);\n  route.task.id.$replace({id});\n});\n")),Object(a.b)("h3",{id:"will-hooks"},"Will Hooks"),Object(a.b)("p",null,'"Will hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"willEnter"),"/",Object(a.b)("inlineCode",{parentName:"p"},"willUpdate"),"/",Object(a.b)("inlineCode",{parentName:"p"},"willLeave"),') are called once all the "before hooks" are called and the navigation has not been cancelled or interrupted. "Will hooks" can also be asynchronous. But unlike "before hooks", it cannot cancel or interrupt a happening navigation. If another navigation is queued before "will" phase completes, it will be processed after the current navigation completes.'),Object(a.b)("h3",{id:"after-hooks"},"After Hooks"),Object(a.b)("p",null,'"After hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"afterEnter"),"/",Object(a.b)("inlineCode",{parentName:"p"},"afterUpdate"),"/",Object(a.b)("inlineCode",{parentName:"p"},"afterLeave"),') are called just before navigation completes. The wording "after" is still considered accurate, because at this phase the route states have already been updated. "After hooks" are synchronous hooks, you can do anything you want in those hooks as it\'s no longer within the scope of Boring Router.'),Object(a.b)("h2",{id:"hook-types"},"Hook Types"),Object(a.b)("h3",{id:"enter-hooks"},"Enter Hooks"),Object(a.b)("p",null,'"Enter hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"beforeEnter"),"/",Object(a.b)("inlineCode",{parentName:"p"},"willEnter"),"/",Object(a.b)("inlineCode",{parentName:"p"},"afterEnter"),") are called during a navigation that turns specific routes from not matched to matched (",Object(a.b)("inlineCode",{parentName:"p"},"$matched"),"). Entering a child route will also enter its parent route. E.g.:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"/account")," -> ",Object(a.b)("inlineCode",{parentName:"li"},"/settings/security"),' will have "enter hooks" correspondent to ',Object(a.b)("inlineCode",{parentName:"li"},"/settings")," and ",Object(a.b)("inlineCode",{parentName:"li"},"/settings/security")," be called."),Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"/settings/security")," -> ",Object(a.b)("inlineCode",{parentName:"li"},"/settings/notification"),' will only have "enter hooks" correspondent to ',Object(a.b)("inlineCode",{parentName:"li"},"/settings/notification")," be called.")),Object(a.b)("h3",{id:"update-hooks"},"Update Hooks"),Object(a.b)("p",null,'"Update hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"beforeUpdate"),"/",Object(a.b)("inlineCode",{parentName:"p"},"willUpdate"),"/",Object(a.b)("inlineCode",{parentName:"p"},"afterUpdate"),") are called during a navigation that updates specific routes. There are several situations:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"/account/123")," -> ",Object(a.b)("inlineCode",{parentName:"li"},"/account/456"),' will have "update hooks" correspondent to ',Object(a.b)("inlineCode",{parentName:"li"},"/account/:account-id"),' be called. "Update hooks" on route ',Object(a.b)("inlineCode",{parentName:"li"},"/account")," are not called, because its own states or parameters are not changed."),Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"/account/123/profile")," -> ",Object(a.b)("inlineCode",{parentName:"li"},"/account/456/profile"),' will have "update hooks" correspondent to ',Object(a.b)("inlineCode",{parentName:"li"},"/account/:account-id")," and ",Object(a.b)("inlineCode",{parentName:"li"},"/account/:account-id/profile")," be called. Because the ",Object(a.b)("inlineCode",{parentName:"li"},"profile")," route inherits parameters from its parent."),Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"/account")," -> ",Object(a.b)("inlineCode",{parentName:"li"},"/account/123"),' (or vice versa) will have "update hooks" correspondent to ',Object(a.b)("inlineCode",{parentName:"li"},"/account")," be called. This is because the state ",Object(a.b)("inlineCode",{parentName:"li"},"$exact")," of route ",Object(a.b)("inlineCode",{parentName:"li"},"/account")," changes from ",Object(a.b)("inlineCode",{parentName:"li"},"true")," to ",Object(a.b)("inlineCode",{parentName:"li"},"false"),".")),Object(a.b)("p",null,"Note that query changes ",Object(a.b)("strong",{parentName:"p"},"WILL NOT"),' trigger "update hooks", however ',Object(a.b)("inlineCode",{parentName:"p"},"$params")," are of course observable."),Object(a.b)("h3",{id:"leave-hooks"},"Leave Hooks"),Object(a.b)("p",null,'"Leave hooks" (',Object(a.b)("inlineCode",{parentName:"p"},"beforeLeave"),"/",Object(a.b)("inlineCode",{parentName:"p"},"willLeave"),"/",Object(a.b)("inlineCode",{parentName:"p"},"afterLeave"),") are called during a navigation that turns specific routes from matched (",Object(a.b)("inlineCode",{parentName:"p"},"$matched"),") to the other way."))}void 0!==b&&b&&b===Object(b)&&Object.isExtensible(b)&&!b.hasOwnProperty("__filemeta")&&Object.defineProperty(b,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"doc/references/lifecycle-hooks.md"}}),b.isMDXComponent=!0}}]);
//# sourceMappingURL=component---doc-references-lifecycle-hooks-md-9fd47b92baf39d6117da.js.map
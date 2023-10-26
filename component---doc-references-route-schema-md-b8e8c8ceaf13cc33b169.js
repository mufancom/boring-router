(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{nCky:function(e,t,n){"use strict";n.r(t),n.d(t,"_frontmatter",(function(){return s})),n.d(t,"default",(function(){return l}));var a=n("Fcif"),r=n("+I+c"),o=(n("mXGw"),n("/FXl")),c=n("TjRS"),i=(n("aD51"),["components"]),s={};void 0!==s&&s&&s===Object(s)&&Object.isExtensible(s)&&!Object.prototype.hasOwnProperty.call(s,"__filemeta")&&Object.defineProperty(s,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"doc/references/route-schema.md"}});var u={_frontmatter:s},b=c.a;function l(e){var t=e.components,n=Object(r.a)(e,i);return Object(o.b)(b,Object(a.a)({},u,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("h1",{id:"route-schema"},"Route Schema"),Object(o.b)("h2",{id:"overview"},"Overview"),Object(o.b)("p",null,"Boring Router defines routes by tree-structure route schemas:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    account: {\n      $children: {\n        accountId: {\n          $match: /\\d+/,\n          $children: {\n            profile: {\n              $query: {\n                'show-comment': true,\n              },\n            },\n            contact: true,\n          },\n        },\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"The route defined above matches paths like below:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre"},"/account/123/profile\n/account/123/profile?show-comment=on\n/account/456/contact\n")),Object(o.b)("p",null,"And it creates route objects (",Object(o.b)("inlineCode",{parentName:"p"},"RouteMatch"),") that can be accessed using:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"route;\nroute.account;\nroute.account.accountId;\nroute.account.accountId.profile;\nroute.account.accountId.contact;\n")),Object(o.b)("p",null,"To get a parameter (including segment parameter and query string) from a route, we need to access ",Object(o.b)("inlineCode",{parentName:"p"},"$params")," of the target route object."),Object(o.b)("p",null,"In this case, to get ",Object(o.b)("inlineCode",{parentName:"p"},"accountId"),", we need to use ",Object(o.b)("inlineCode",{parentName:"p"},"route.account.accountId.$params.accountId"),". This might look a little bit weird at the beginning (maybe forever), but it's also reasonable: because ",Object(o.b)("inlineCode",{parentName:"p"},"accountId")," (the segment parameter) is one of the properties of route ",Object(o.b)("inlineCode",{parentName:"p"},"route.account.accountId"),", and its name by convention is the same as the route key."),Object(o.b)("p",null,"We can also get the parameter from a child route object, e.g.: ",Object(o.b)("inlineCode",{parentName:"p"},"route.account.accountId.profile.$params.accountId"),"."),Object(o.b)("h2",{id:"match"},"Match"),Object(o.b)("p",null,"By adding a child under ",Object(o.b)("inlineCode",{parentName:"p"},"$children"),", we create a ",Object(o.b)("inlineCode",{parentName:"p"},"RouteMatch")," for the correspondent segment:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    // Simply use `true` for default options.\n    workbench: true,\n    // Specify route options with an object.\n    settings: {\n      $match: /boring/,\n      $children: {\n        security: true,\n        notification: true,\n      },\n    },\n  },\n});\n")),Object(o.b)("h3",{id:"segment-match"},"Segment Match"),Object(o.b)("p",null,'By default, Boring Router matches a segment according to the "hyphenated" string of the route key.'),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    // This matches `/user-settings`.\n    userSettings: true,\n  },\n});\n")),Object(o.b)("p",null,"To match another fixed string, we may add a string ",Object(o.b)("inlineCode",{parentName:"p"},"$match")," option:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    // This matches `/settings`.\n    userSettings: {\n      $match: 'settings',\n    },\n  },\n});\n")),Object(o.b)("p",null,"To make the segment a segment parameter, we may add ",Object(o.b)("inlineCode",{parentName:"p"},"$match")," option as regular expression:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    // This matches both `/settings` and `/user-settings`.\n    userSettings: {\n      $match: /(?:user-)?settings/,\n    },\n  },\n});\n")),Object(o.b)("p",null,"And now we can get the actual matched segment by ",Object(o.b)("inlineCode",{parentName:"p"},"route.userSettings.$params.userSettings"),"."),Object(o.b)("p",null,"Please note that the regular expression must match the whole string of a segment. Assuming the path is ",Object(o.b)("inlineCode",{parentName:"p"},"/settings-suffix"),", even though ",Object(o.b)("inlineCode",{parentName:"p"},"/(?:user-)?settings/.test('settings-suffix')")," is true, but it won't match the route because the regular expression matches only ",Object(o.b)("inlineCode",{parentName:"p"},"settings")," instead of the whole segment ",Object(o.b)("inlineCode",{parentName:"p"},"settings-suffix"),"."),Object(o.b)("h3",{id:"exact-match"},"Exact Match"),Object(o.b)("p",null,"For route with children, by default it ignores the exact match. This means that the route defined in the ",Object(o.b)("a",{parentName:"p",href:"#overview"},"Overview")," section does not match paths like:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre"},"/account\n/account/123\n")),Object(o.b)("p",null,"To allow exact match for those parent routes, we need to set ",Object(o.b)("inlineCode",{parentName:"p"},"$exact")," as ",Object(o.b)("inlineCode",{parentName:"p"},"true")," respectively."),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    account: {\n      $exact: true,\n      $children: {\n        /* ... */\n      },\n    },\n  },\n});\n")),Object(o.b)("h3",{id:"exact-match-default"},"Exact Match Default"),Object(o.b)("p",null,"Sometimes we might want a default child route to act as matched if its parent is exactly matched. E.g., for settings pages ",Object(o.b)("inlineCode",{parentName:"p"},"/settings/user")," and ",Object(o.b)("inlineCode",{parentName:"p"},"/settings/organization"),", we might want an exact match of ",Object(o.b)("inlineCode",{parentName:"p"},"/settings")," to act as if ",Object(o.b)("inlineCode",{parentName:"p"},"/settings/user")," is matched. And we may specify a string value for ",Object(o.b)("inlineCode",{parentName:"p"},"$exact")," to achieve that:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    settings: {\n      $exact: 'user',\n      $children: {\n        user: true,\n        organization: true,\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"Note this value is not specified according to the key but the path segment. So if the key of the child route is ",Object(o.b)("inlineCode",{parentName:"p"},"awesomeUser"),", the ",Object(o.b)("inlineCode",{parentName:"p"},"$exact")," value should be ",Object(o.b)("inlineCode",{parentName:"p"},"awesome-user")," with default configuration."),Object(o.b)("h2",{id:"query"},"Query"),Object(o.b)("p",null,"The ability of handling query string in Boring Router is limited for now. It has some handy usages, but all ",Object(o.b)("inlineCode",{parentName:"p"},"$query")," definition is handled as optional strings without validations."),Object(o.b)("blockquote",null,Object(o.b)("p",{parentName:"blockquote"},"This problem can be partially solved by ",Object(o.b)("a",{parentName:"p",href:"/boring-router/references/route-schema#extension"},"Extension")," & ",Object(o.b)("a",{parentName:"p",href:"/boring-router/references/service#managed-extension"},"Service"),".")),Object(o.b)("p",null,"To get access to a specific query string, just add ",Object(o.b)("inlineCode",{parentName:"p"},"$query")," options and set a ",Object(o.b)("inlineCode",{parentName:"p"},"true")," value of the desired key:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    account: {\n      $query: {\n        group: true,\n        id: true,\n      },\n      $children: {\n        profile: true,\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"Just like segment parameter, we can get a query string from ",Object(o.b)("inlineCode",{parentName:"p"},"$params"),". In this case, from both the route declaring the query string and its child route:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"route.account.$params.group;\nroute.account.$params.id;\nroute.account.profile.$params.group;\nroute.account.profile.$params.id;\n")),Object(o.b)("h3",{id:"query-string-preservation"},"Query String Preservation"),Object(o.b)("p",null,"By default, route builder (when you click a ",Object(o.b)("inlineCode",{parentName:"p"},"<Link>")," or trigger ",Object(o.b)("inlineCode",{parentName:"p"},"RouteMatch#$ref()"),' directly or indirectly) keeps query strings declared at the next matching route when creating a new "ref" for navigation. Think of the example below:'),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    account: {\n      $query: {\n        source: true,\n      },\n    },\n    about: {\n      $query: {\n        source: true,\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"If the current route matches ",Object(o.b)("inlineCode",{parentName:"p"},"/account?source=123"),", the result of ",Object(o.b)("inlineCode",{parentName:"p"},"route.about.$ref()")," would be ",Object(o.b)("inlineCode",{parentName:"p"},"/about?source=123"),"."),Object(o.b)("p",null,"We can provide specific query IDs for different queries to achieve more accurate query string preservation:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    account: {\n      $query: {\n        source: 'account-source',\n      },\n    },\n    about: {\n      $query: {\n        source: 'about-source',\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"A query ID could be either a string or a symbol. If ",Object(o.b)("inlineCode",{parentName:"p"},"true")," is provided, it will always preserve query string with the same key or be preserved by other query string with the same key."),Object(o.b)("h2",{id:"metadata"},"Metadata"),Object(o.b)("p",null,"You may add metadata to a specific route and its child route will automatically inherit the metadata."),Object(o.b)("p",null,"For example:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    user: {\n      $metadata: {\n        title: 'User',\n      },\n      $exact: true,\n      $children: {\n        settings: {\n          $metadata: {\n            subTitle: 'Settings',\n          },\n        },\n      },\n    },\n    workbench: {\n      $metadata: {\n        title: 'Workbench',\n      },\n    },\n  },\n});\n\nroute.user.$metadata; // {title: 'User'}\nroute.user.settings.$metadata; // {title: 'User', subTitle: 'Settings'}\n")),Object(o.b)("p",null,"Then we can use the metadata to update page title once the route changes:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"route.$afterEnterOrUpdate(\n  () => {\n    let {title, subTitle} = route.$rest.$metadata as {\n      title: string;\n      subTitle?: string;\n    };\n\n    document.title = `${subTitle ? `${subTitle} | ` : ''}${title}`;\n  },\n  {traceDescendants: true},\n);\n")),Object(o.b)("h2",{id:"extension"},"Extension"),Object(o.b)("p",null,"Boring Router provides a way to add addition property to a specific route through ",Object(o.b)("inlineCode",{parentName:"p"},"$extension")," route option:"),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    user: {\n      $query: {\n        id: true,\n      },\n      $extension: {\n        get user() {\n          return new User(route.user.$params.id);\n        },\n      },\n    },\n  },\n});\n")),Object(o.b)("p",null,"One of our common use case is just to provide type information with ",Object(o.b)("inlineCode",{parentName:"p"},"$extension")," and later have a route service to manage the actual value, with which more options are provided."),Object(o.b)("pre",null,Object(o.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    user: {\n      $query: {\n        id: true,\n      },\n      $extension: {\n        user: undefined! as User,\n      },\n    },\n  },\n});\n\nroute.user.$service(match => new UserRouteService(match));\n\ntype UserRoute = typeof route.user;\n\nclass UserRouteService implements IRouteService<UserRoute> {\n  @observable\n  user!: User;\n\n  constructor(private match: UserRoute) {}\n\n  async willEnter(next: UserRoute['$next']): Promise<void> {\n    this.user = await getUser(next.$params.id);\n  }\n\n  afterLeave(): void {\n    this.user = undefined!;\n  }\n}\n")),Object(o.b)("blockquote",null,Object(o.b)("p",{parentName:"blockquote"},"Checkout ",Object(o.b)("a",{parentName:"p",href:"/boring-router/references/service"},"Service")," for more information.")))}void 0!==l&&l&&l===Object(l)&&Object.isExtensible(l)&&!Object.prototype.hasOwnProperty.call(l,"__filemeta")&&Object.defineProperty(l,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"doc/references/route-schema.md"}}),l.isMDXComponent=!0}}]);
//# sourceMappingURL=component---doc-references-route-schema-md-b8e8c8ceaf13cc33b169.js.map
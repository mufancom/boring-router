(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{pAms:function(e,n,t){"use strict";t.r(n),t.d(n,"_frontmatter",(function(){return i})),t.d(n,"default",(function(){return b}));var o=t("Fcif"),c=t("+I+c"),r=(t("mXGw"),t("/FXl")),a=t("TjRS"),s=(t("aD51"),["components"]),i={};void 0!==i&&i&&i===Object(i)&&Object.isExtensible(i)&&!Object.prototype.hasOwnProperty.call(i,"__filemeta")&&Object.defineProperty(i,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"doc/references/service.md"}});var u={_frontmatter:i},l=a.a;function b(e){var n=e.components,t=Object(c.a)(e,s);return Object(r.b)(l,Object(o.a)({},u,t,{components:n,mdxType:"MDXLayout"}),Object(r.b)("h1",{id:"service"},"Service"),Object(r.b)("p",null,"Every ",Object(r.b)("inlineCode",{parentName:"p"},"RouteMatch")," can be backed by a route service in Boring Router, providing additional flexibility with states comparing to lifecycle hooks."),Object(r.b)("p",null,'A route service gets only "activated" when the route matches. And we can provide both pre-instantiated service or service factory:'),Object(r.b)("pre",null,Object(r.b)("code",{parentName:"pre",className:"language-ts"},"route.account.$service(new AccountRouteService());\n\nroute.settings.$service(match => new SettingsRouteService(match));\n\nroute.workbench.$service(async match => {\n  // asynchronous code...\n  return new WorkbenchRouteService(match);\n});\n")),Object(r.b)("p",null,"Service factory will be called on demand."),Object(r.b)("h2",{id:"lifecycle-hooks"},"Lifecycle Hooks"),Object(r.b)("p",null,"Lifecycle hooks are supported by service as optional methods:"),Object(r.b)("pre",null,Object(r.b)("code",{parentName:"pre",className:"language-ts"},"type AccountRoute = typeof route.account;\n\nclass AccountRouteService implements IRouteService<AccountRoute> {\n  constructor(private match: AccountRoute) {}\n\n  async beforeEnter(next: AccountRoute['$next']): Promise<void> {}\n\n  async willEnter(next: AccountRoute['$next']): Promise<void> {}\n\n  async afterEnter(): void {}\n\n  async beforeUpdate(next: AccountRoute['$next']): Promise<void> {\n    this.beforeEnter(next);\n  }\n\n  async willUpdate(next: AccountRoute['$next']): Promise<void> {\n    this.willEnter(next);\n  }\n\n  async afterUpdate(): void {\n    this.afterEnter();\n  }\n\n  async beforeLeave(): Promise<void> {}\n\n  async willLeave(): Promise<void> {}\n\n  afterLeave(): void {}\n}\n")),Object(r.b)("blockquote",null,Object(r.b)("p",{parentName:"blockquote"},"For full signatures of lifecycle hook methods, checkout ",Object(r.b)("a",{parentName:"p",href:"/boring-router/references/lifecycle-hooks"},"Lifecycle Hooks")," and type information.")),Object(r.b)("h2",{id:"managed-extension"},"Managed Extension"),Object(r.b)("p",null,"We can add extension to a route with predefined values or getters (see also ",Object(r.b)("a",{parentName:"p",href:"/boring-router/references/route-schema#extension"},"Route Schema Extension"),"), and route service provides a way to manage extension."),Object(r.b)("p",null,"When the route is matched, accessing an extension value will first access the correspondent value on the service instance. It the key does not exist on the service instance, it will then fallback to the ",Object(r.b)("inlineCode",{parentName:"p"},"$extension")," object provided by route schema."),Object(r.b)("p",null,"Note only value with keys predefined in ",Object(r.b)("inlineCode",{parentName:"p"},"$extension")," (using ",Object(r.b)("inlineCode",{parentName:"p"},"Object.keys()"),") can be accessed through this mechanism."),Object(r.b)("p",null,"E.g.:"),Object(r.b)("pre",null,Object(r.b)("code",{parentName:"pre",className:"language-ts"},"const route = router.$route({\n  $children: {\n    user: {\n      $children: {\n        userId: {\n          $match: /\\d+/,\n          $extension: {\n            user: undefined! as User,\n          },\n        },\n      },\n    },\n  },\n});\n\nroute.user.userId.$service(() => new UserIdRouteService());\n\ntype UserIdRoute = typeof route.user.userId;\n\nclass UserIdRouteService implements IRouteService<UserIdRoute> {\n  @observable\n  user!: User;\n\n  willEnter(next: UserIdRoute['$next']): void {\n    this.user = new User(next.$params.userId);\n  }\n\n  afterLeave(): void {\n    this.user = undefined!;\n  }\n}\n")),Object(r.b)("p",null,"Thus we can easily access the ",Object(r.b)("inlineCode",{parentName:"p"},"user")," elsewhere. For example within route content:"),Object(r.b)("pre",null,Object(r.b)("code",{parentName:"pre",className:"language-tsx"},"<Route match={route.user.userId}>\n  {match => <div>Hello, user {match.user.displayName}.</div>}\n</Route>\n")))}void 0!==b&&b&&b===Object(b)&&Object.isExtensible(b)&&!Object.prototype.hasOwnProperty.call(b,"__filemeta")&&Object.defineProperty(b,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"doc/references/service.md"}}),b.isMDXComponent=!0}}]);
//# sourceMappingURL=component---doc-references-service-md-5e43efe5d52f467ee31b.js.map
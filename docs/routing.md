## The website have one main domain and one subdomain. 

### domain: tielo.io

This is the primary website used for promotion and job application.

No admin or password protection only static pages and a job application page.

Clerk based authentication is not neccassary.

The hr page should also come like this

tielo.io/hr

### subdomain: portal.tielo.io

This is a HR portal.

If user comes on the portal.tielo.io they should go to portal.tielo.io/auth for login/signup

the pages under this subdomain should come from this 

portal.tielo.io/attendance
portal.tielo.io/settings


### The Admin page is part of the portal.tielo.io so it can be accessed from portal.tielo.io/admin

the admin pages can be accessed by portal.tielo.io/admin/settings. 

## The intended structure is like this.

In production:

tielo.io → Main website (marketing, careers, job applications)
portal.tielo.io → HR portal (authentication required)
